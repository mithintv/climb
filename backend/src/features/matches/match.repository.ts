import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

import { DRIZZLE } from "./../../core/database/database.constant.ts";
import type { Drizzle } from "./../../core/database/drizzle.ts";
import { matchParticipants } from "./../../core/database/models/match-participants.model.ts";
import { matches } from "./../../core/database/models/matches.model.ts";
import { encodeMatchPayload } from "./match-payload.utils.ts";
import { projectMatch, projectParticipants } from "./match-projection.utils.ts";
import type { IRiotMatchDto } from "./types/i-riot-match-dto.type.ts";

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
		const projection = projectMatch(match.matchId, match.dto);
		const participants = projectParticipants(match.dto);

		return this.db.transaction(async (tx) => {
			const [row] = await tx
				.insert(matches)
				.values({ ...projection, ...payload, fetchedAt: match.fetchedAt })
				.onConflictDoNothing({ target: matches.matchId })
				.returning({ id: matches.id });

			if (!row) return { stored: false };

			if (participants.length > 0) {
				await tx.insert(matchParticipants).values(
					participants.map((participant) => ({
						...participant,
						matchRowId: row.id,
					})),
				);
			}

			return { stored: true };
		});
	}
}
