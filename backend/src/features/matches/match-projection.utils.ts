import type { matchParticipants } from "./../../core/database/models/match-participants.model.ts";
import type { matches } from "./../../core/database/models/matches.model.ts";
import type { PerkKind } from "./../../core/database/types/perk-kind.type.ts";
import type { IRiotMatchDto } from "./types/i-riot-match-dto.type.ts";

/**
 * Which release of the extractors below produced a row's columns.
 *
 * Bump it whenever a projected column starts being derived differently, so the
 * rows written by the old rule can be found and recomputed from their stored
 * payloads. It is not a schema version: adding a column that was always null
 * before does not change what the existing rows mean.
 */
export const PROJECTION_VERSION = 2;

/**
 * The `matches` columns derived from the payload, without the blob itself.
 *
 * The five lookup columns are not among them: they are rows in other tables,
 * and resolving one needs the database. This stays a pure function of the
 * payload, so it hands the repository the raw values to look up — nullable
 * here, even though the columns they become are `NOT NULL`, because "the
 * payload did not say" is a fact about the payload and substituting the
 * "unknown" row for it is a fact about storage.
 */
type MatchProjection = Omit<
	typeof matches.$inferInsert,
	| "id"
	| "matchId"
	| "payload"
	| "payloadEncoding"
	| "payloadBytes"
	| "fetchedAt"
	| "queueId"
	| "mapId"
	| "gameModeId"
	| "gameTypeId"
	| "patchId"
> & {
	/** Riot's queue id, e.g. 420. Resolved to a `game_queues` row on write. */
	queueId: number | null;
	/** Riot's map id, e.g. 11. */
	mapId: number | null;
	/** Riot's mode token, e.g. "CHERRY". */
	gameMode: string | null;
	/** Riot's type token, e.g. "MATCHED_GAME". */
	gameType: string | null;
	/** The parsed patch, or null when the payload carried no `gameVersion`. */
	patch: { major: number; minor: number } | null;
};

/** The `match_participants` columns, before the row they hang off exists. */
type MatchParticipantProjection = Omit<
	typeof matchParticipants.$inferInsert,
	"id" | "matchRowId"
>;

/**
 * Splits a match id into the platform and game id it is built from.
 *
 * The id is `platform_id + "_" + game_id` in every sampled payload, so this is
 * the authoritative source for both — more so than `info.platformId`, which the
 * caller has no way to have asked for. A `matchId` in some other shape is a
 * caller error rather than a Riot one, so this one does throw.
 */
const splitMatchId = (matchId: string) => {
	const separator = matchId.indexOf("_");
	const gameId = Number(matchId.slice(separator + 1));
	if (separator <= 0 || !Number.isSafeInteger(gameId)) {
		throw new Error(`Not a match id: ${matchId}`);
	}
	return { platformId: matchId.slice(0, separator), gameId };
};

/**
 * Splits Riot's build string into the patch it belongs to.
 *
 * "16.14.794.9266" is patch 16.14 built 794.9266; one patch ships several
 * builds, and only the first two components are the patch anyone names. They
 * come back as numbers so 16.9 orders before 16.14, which it would not as text.
 *
 * Returns null rather than throwing on anything that is not two leading
 * numbers, because a `gameVersion` Riot has reshaped must not fail an ingest.
 */
export const parseGameVersion = (gameVersion: string | undefined) => {
	const [major, minor] = (gameVersion ?? "").split(".");
	if (!/^\d+$/.test(major ?? "") || !/^\d+$/.test(minor ?? "")) return null;
	return { major: Number(major), minor: Number(minor) };
};

/**
 * Projects the columns a match is filtered and sorted by.
 *
 * Nothing here throws on a missing field: a payload whose `info` block Riot has
 * restructured still ingests, with null columns and a blob that can be
 * re-projected once the extractors catch up.
 */
export const projectMatch = (
	matchId: string,
	dto: IRiotMatchDto,
): MatchProjection => {
	const { platformId, gameId } = splitMatchId(matchId);
	const info = dto.info;

	return {
		platformId,
		gameId,
		dataVersion: dto.metadata?.dataVersion ?? null,
		queueId: info?.queueId ?? null,
		mapId: info?.mapId ?? null,
		gameMode: info?.gameMode ?? null,
		patch: parseGameVersion(info?.gameVersion),
		gameType: info?.gameType ?? null,
		gameCreation: info?.gameCreation ?? null,
		gameStartMs: info?.gameStartTimestamp ?? null,
		gameEndMs: info?.gameEndTimestamp ?? null,
		gameDuration: info?.gameDuration ?? null,
		endOfGameResult: info?.endOfGameResult ?? null,
		projectionVersion: PROJECTION_VERSION,
	};
};

/** One participant's `perks` block, narrowed off the DTO so it is not restated. */
type RiotPerks = NonNullable<
	NonNullable<IRiotMatchDto["info"]>["participants"]
>[number]["perks"];

/** One perk a participant took, before the row it hangs off exists. */
export interface IParticipantPerkPick {
	/** Which pick this is, and so how to read `slot`. */
	kind: PerkKind;
	/** Position within the kind; slot 0 of `PRIMARY` is the keystone. */
	slot: number;
	/** The tree it came from. Null for a stat shard, which belongs to none. */
	styleId: number | null;
	perkId: number;
}

/** Every perk one participant took, keyed back to their position in the payload. */
export interface IParticipantPerks {
	participantIndex: number;
	picks: IParticipantPerkPick[];
}

/**
 * Pulls every perk out of one participant's `perks` block — both trees' runes
 * and the three stat shards.
 *
 * Riot labels the tree entries `description: "primaryStyle" | "subStyle"`,
 * which is preferred to their order; the positional fallback covers a payload
 * where the label is absent.
 *
 * The shards are read in Riot's own key order — offense, flex, defense — which
 * becomes slots 0, 1 and 2. An id of 0 is kept rather than dropped: Riot sends
 * 0 for "no shard", and Arena sends it for all three, so a missing row and a
 * deliberate zero would otherwise be indistinguishable.
 */
const projectPerkPicks = (perks: RiotPerks): IParticipantPerkPick[] => {
	const styles = perks?.styles;
	const primary =
		styles?.find((style) => style.description === "primaryStyle") ??
		styles?.[0];
	const sub =
		styles?.find((style) => style.description === "subStyle") ?? styles?.[1];

	const fromTrees = (
		[
			{ style: primary, kind: "PRIMARY" },
			{ style: sub, kind: "SECONDARY" },
		] as const
	).flatMap(({ style, kind }) => {
		// A tree with no id is a payload that has restructured `perks`; its picks
		// have nothing to hang off, so they are dropped rather than guessed at.
		const styleId = style?.style;
		if (styleId === undefined) return [];

		return (style?.selections ?? []).flatMap((selection, slot) =>
			selection.perk === undefined
				? []
				: [{ kind, slot, styleId, perkId: selection.perk }],
		);
	});

	const stats = perks?.statPerks;
	const fromStats = [stats?.offense, stats?.flex, stats?.defense].flatMap(
		(perkId, slot) =>
			perkId === undefined
				? []
				: [{ kind: "STAT" as const, slot, styleId: null, perkId }],
	);

	return [...fromTrees, ...fromStats];
};

/**
 * Projects every participant's runes, in the same participant order as
 * `projectParticipants` — the index is how the two are matched up once the
 * participant rows have ids.
 */
export const projectParticipantPerks = (
	dto: IRiotMatchDto,
): IParticipantPerks[] =>
	(dto.info?.participants ?? []).flatMap((participant, participantIndex) =>
		participant.puuid
			? [{ participantIndex, picks: projectPerkPicks(participant.perks) }]
			: [],
	);

/**
 * Projects one row per participant, in Riot's own order — the index is half the
 * row's identity, so it must stay the position in `info.participants`.
 *
 * Handles Arena (queue 1700, `CHERRY`) without a branch: its 16 participants
 * carry an empty `team_position` and a populated `placement`, and its two
 * `teams` entries are not read here at all.
 *
 * A participant with no puuid is dropped rather than stored under an empty
 * string, since `puuid` is the column every read filters on. It has not been
 * seen in a real payload; the blob keeps the entry either way.
 */
export const projectParticipants = (
	dto: IRiotMatchDto,
): MatchParticipantProjection[] => {
	const participants = dto.info?.participants ?? [];

	return participants.flatMap((participant, participantIndex) => {
		if (!participant.puuid) return [];

		return [
			{
				participantIndex,
				puuid: participant.puuid,
				// Riot emptied `summonerName` — it is "" on all 178 sampled
				// participants — so the riot id fields are the only name here.
				riotIdGameName: participant.riotIdGameName ?? null,
				riotIdTagline: participant.riotIdTagline ?? null,
				teamId: participant.teamId ?? null,
				teamPosition: participant.teamPosition ?? null,
				championId: participant.championId ?? null,
				championName: participant.championName ?? null,
				win: participant.win ?? null,
				kills: participant.kills ?? null,
				deaths: participant.deaths ?? null,
				assists: participant.assists ?? null,
				goldEarned: participant.goldEarned ?? null,
				totalMinionsKilled: participant.totalMinionsKilled ?? null,
				neutralMinionsKilled: participant.neutralMinionsKilled ?? null,
				summoner1Id: participant.summoner1Id ?? null,
				summoner2Id: participant.summoner2Id ?? null,
				item0: participant.item0 ?? null,
				item1: participant.item1 ?? null,
				item2: participant.item2 ?? null,
				item3: participant.item3 ?? null,
				item4: participant.item4 ?? null,
				item5: participant.item5 ?? null,
				item6: participant.item6 ?? null,
				// Riot reports 0 outside Arena rather than omitting the field, and 0
				// is not a placement — normalised so the column means "finished
				// where" and nothing else. The payload keeps the 0 either way.
				placement: participant.placement || null,
			},
		];
	});
};
