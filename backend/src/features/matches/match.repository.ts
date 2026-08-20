import { Inject, Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";

import { DRIZZLE } from "./../../core/database/database.constant.ts";
import type { Drizzle } from "./../../core/database/drizzle.ts";
import { gameMaps } from "./../../core/database/models/game-maps.model.ts";
import { gameModes } from "./../../core/database/models/game-modes.model.ts";
import { gamePlatforms } from "./../../core/database/models/game-platforms.model.ts";
import { gameQueues } from "./../../core/database/models/game-queues.model.ts";
import { gameTypes } from "./../../core/database/models/game-types.model.ts";
import { matchParticipantPerks } from "./../../core/database/models/match-participant-perks.model.ts";
import { matchParticipants } from "./../../core/database/models/match-participants.model.ts";
import { matches } from "./../../core/database/models/matches.model.ts";
import { patches } from "./../../core/database/models/patches.model.ts";
import { perks } from "./../../core/database/models/perks.model.ts";
import { encodeMatchPayload } from "./match-payload.utils.ts";
import {
	type IParticipantPerks,
	projectMatch,
	projectParticipantPerks,
	projectParticipants,
} from "./match-projection.utils.ts";
import type { IRiotMatchDto } from "./types/i-riot-match-dto.type.ts";
import {
	UNKNOWN_GAME_MODE,
	UNKNOWN_GAME_TYPE,
	UNKNOWN_MAP_ID,
	UNKNOWN_PATCH,
	UNKNOWN_QUEUE_ID,
} from "./unknown-lookup-row.constant.ts";

/** A fetched match, as it arrives from Riot and before it becomes rows. */
export interface IMatchToStore {
	/** The id it was fetched by, which is where `platform_id`/`game_id` come from. */
	matchId: string;
	/** The response body exactly as it arrived, not a re-serialised object. */
	body: string;
	/** The same body parsed, which only the projection reads. */
	dto: IRiotMatchDto;
	/** Epoch ms of the fetch. */
	fetchedAt: number;
}

/** Every read and write against `matches` and `match_participants`. */
@Injectable()
export class MatchRepository {
	private readonly db: Drizzle;

	constructor(@Inject(DRIZZLE) db: Drizzle) {
		this.db = db;
	}

	/**
	 * The stored payload for a match, or undefined if it has not been ingested.
	 *
	 * Selects the blob and its encoding and nothing else — the projected columns
	 * exist to be filtered on, and the response is rebuilt from the bytes.
	 */
	async findPayload(matchId: string) {
		const [row] = await this.db
			.select({
				payload: matches.payload,
				payloadEncoding: matches.payloadEncoding,
			})
			.from(matches)
			.where(eq(matches.matchId, matchId))
			.limit(1);

		return row;
	}

	/**
	 * Writes a match and its participants, and reports whether this call is what
	 * stored them.
	 *
	 * Both statements go in one transaction, so a match row never exists without
	 * its participants. The insert is `ON CONFLICT DO NOTHING` because two
	 * requests for the same unsaved match now race across pooled connections
	 * rather than queueing behind a single one; the loser gets `false` back and
	 * has nothing to do — a completed match is immutable, so the row already
	 * there is the same row it would have written.
	 */
	async ingest(match: IMatchToStore) {
		const payload = encodeMatchPayload(match.body);
		const { queueId, mapId, gameMode, gameType, patch, ...projection } =
			projectMatch(match.matchId, match.dto);
		const participants = projectParticipants(match.dto);
		const perkPicks = projectParticipantPerks(match.dto);

		return this.db.transaction(async (tx) => {
			// Inside the transaction, so a match is never written pointing at a
			// lookup row that a rollback then removes.
			const at = match.fetchedAt;
			const lookups = {
				// No "unknown" fallback: the platform comes from the match id the
				// caller asked for, which `projectMatch` has already refused to parse
				// if it were not there.
				platformId: await ensurePlatform(tx, projection.platformId, at),
				queueId: await ensureRiotId(
					tx,
					gameQueues,
					queueId ?? UNKNOWN_QUEUE_ID,
					at,
				),
				mapId: await ensureRiotId(tx, gameMaps, mapId ?? UNKNOWN_MAP_ID, at),
				gameModeId: await resolveGameModeId(tx, gameMode, at),
				gameTypeId: await resolveGameTypeId(tx, gameType, at),
				patchId: await resolvePatchId(tx, patch, at),
			};

			const [row] = await tx
				.insert(matches)
				.values({
					...projection,
					...lookups,
					...payload,
					fetchedAt: match.fetchedAt,
				})
				.onConflictDoNothing({ target: matches.matchId })
				.returning({ id: matches.id });

			if (!row) return { stored: false };

			if (participants.length > 0) {
				// The ids come back so the runes below can be hung off them; the
				// participant index is what matches the two projections up.
				const written = await tx
					.insert(matchParticipants)
					.values(
						participants.map((participant) => ({
							...participant,
							matchRowId: row.id,
						})),
					)
					.returning({
						id: matchParticipants.id,
						participantIndex: matchParticipants.participantIndex,
					});

				await this.writePerks(tx, written, perkPicks, at);
			}

			return { stored: true };
		});
	}

	/**
	 * Writes the runes every participant took.
	 *
	 * Each distinct perk id is guaranteed a `perks` row first, because the
	 * foreign keys demand one and the payload can name a rune the committed Data
	 * Dragon asset has never heard of — one added next preseason, or Arena's
	 * literal `0`, where the payload reports no runes at all. Those rows carry an
	 * id and nothing else until the next seed fills them in, which is better than
	 * failing a match over a rune nobody has named yet.
	 */
	private async writePerks(
		tx: MatchTransaction,
		written: { id: number; participantIndex: number }[],
		perkPicks: IParticipantPerks[],
		dateCreated: number,
	) {
		const idByIndex = new Map(
			written.map((row) => [row.participantIndex, row.id]),
		);
		const rows = perkPicks.flatMap((participant) => {
			const matchParticipantId = idByIndex.get(participant.participantIndex);
			if (matchParticipantId === undefined) return [];
			return participant.picks.map((pick) => ({ ...pick, matchParticipantId }));
		});

		if (rows.length === 0) return;

		// Stat shards have no tree, so only their own id needs a row.
		const referenced = [
			...new Set(
				rows.flatMap((row) =>
					row.styleId === null ? [row.perkId] : [row.styleId, row.perkId],
				),
			),
		];
		await tx
			.insert(perks)
			.values(referenced.map((id) => ({ id, dateCreated })))
			.onConflictDoNothing();

		await tx.insert(matchParticipantPerks).values(rows);
	}
}

/** The transaction handle `ingest` hands its lookups, inferred off the schema. */
type MatchTransaction = Parameters<Parameters<Drizzle["transaction"]>[0]>[0];

/**
 * Records that a queue or map id has been seen, and hands it straight back.
 *
 * These two tables are keyed on Riot's own id, so there is nothing to look up —
 * the caller already has the value the match column needs. That makes
 * `DO NOTHING` enough: the insert exists only so the foreign key has something
 * to point at.
 */
const ensureRiotId = async (
	tx: MatchTransaction,
	table: typeof gameQueues | typeof gameMaps,
	id: number,
	dateCreated: number,
) => {
	await tx.insert(table).values({ id, dateCreated }).onConflictDoNothing();
	return id;
};

/** As `ensureRiotId`, for the platform, whose key is Riot's token rather than a number. */
const ensurePlatform = async (
	tx: MatchTransaction,
	id: string,
	dateCreated: number,
) => {
	await tx
		.insert(gamePlatforms)
		.values({ id, dateCreated })
		.onConflictDoNothing();
	return id;
};

/**
 * The id of a lookup row, inserting it if this is the first time the value has
 * been seen, and falling back to the "unknown" row when the payload gave none.
 *
 * Unlike `ensureRiotId` these tables have surrogate keys, so the row has to come
 * back. `DO UPDATE` rather than `DO NOTHING` for that reason: `DO NOTHING`
 * returns nothing on a conflict, so a concurrent ingest of the same new mode
 * would come back empty and need a second query. Writing the conflicting column
 * to itself is a no-op that still returns the existing id, so this is one
 * statement either way.
 */
const resolveGameModeId = async (
	tx: MatchTransaction,
	mode: string | null,
	dateCreated: number,
) => {
	const [row] = await tx
		.insert(gameModes)
		.values({ mode: mode ?? UNKNOWN_GAME_MODE, dateCreated })
		.onConflictDoUpdate({
			target: gameModes.mode,
			set: { mode: sql`excluded.mode` },
		})
		.returning({ id: gameModes.id });

	return row.id;
};

/** As `resolveGameModeId`, over Riot's game type token. */
const resolveGameTypeId = async (
	tx: MatchTransaction,
	type: string | null,
	dateCreated: number,
) => {
	const [row] = await tx
		.insert(gameTypes)
		.values({ type: type ?? UNKNOWN_GAME_TYPE, dateCreated })
		.onConflictDoUpdate({
			target: gameTypes.type,
			set: { type: sql`excluded.type` },
		})
		.returning({ id: gameTypes.id });

	return row.id;
};

/** As `resolveGameModeId`, keyed on the patch's two numeric components. */
const resolvePatchId = async (
	tx: MatchTransaction,
	patch: { major: number; minor: number } | null,
	dateCreated: number,
) => {
	const [row] = await tx
		.insert(patches)
		.values({ ...(patch ?? UNKNOWN_PATCH), dateCreated })
		.onConflictDoUpdate({
			target: [patches.major, patches.minor],
			set: { major: sql`excluded.major` },
		})
		.returning({ id: patches.id });

	return row.id;
};
