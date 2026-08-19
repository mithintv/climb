import type { matchParticipants } from "./../../core/database/models/match-participants.model.ts";
import type { matches } from "./../../core/database/models/matches.model.ts";
import type { IRiotMatchDto } from "./types/i-riot-match-dto.type.ts";

/**
 * Which release of the extractors below produced a row's columns.
 *
 * Bump it whenever a projected column starts being derived differently, so the
 * rows written by the old rule can be found and recomputed from their stored
 * payloads. It is not a schema version: adding a column that was always null
 * before does not change what the existing rows mean.
 */
export const PROJECTION_VERSION = 1;

/** The `matches` columns derived from the payload, without the blob itself. */
type MatchProjection = Omit<
	typeof matches.$inferInsert,
	"id" | "payload" | "payloadEncoding" | "payloadBytes" | "fetchedAt"
>;

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
		matchId,
		platformId,
		gameId,
		dataVersion: dto.metadata?.dataVersion ?? null,
		queueId: info?.queueId ?? null,
		mapId: info?.mapId ?? null,
		gameMode: info?.gameMode ?? null,
		gameType: info?.gameType ?? null,
		gameVersion: info?.gameVersion ?? null,
		gameCreation: info?.gameCreation ?? null,
		gameStartMs: info?.gameStartTimestamp ?? null,
		gameEndMs: info?.gameEndTimestamp ?? null,
		gameDuration: info?.gameDuration ?? null,
		endOfGameResult: info?.endOfGameResult ?? null,
		projectionVersion: PROJECTION_VERSION,
	};
};

/** One entry of `perks.styles`, narrowed off the DTO so it is not restated. */
type RiotPerkStyle = NonNullable<
	NonNullable<
		NonNullable<IRiotMatchDto["info"]>["participants"]
	>[number]["perks"]
>["styles"];

/**
 * Pulls the two rune trees and the keystone out of `perks.styles`.
 *
 * Riot labels the entries `description: "primaryStyle" | "subStyle"`, which is
 * preferred to their order; the positional fallback covers a payload where the
 * label is absent. The keystone is the first selection of the primary tree —
 * the secondary tree has no keystone, only minor runes.
 */
const projectPerks = (styles: RiotPerkStyle) => {
	const primary =
		styles?.find((style) => style.description === "primaryStyle") ??
		styles?.[0];
	const sub =
		styles?.find((style) => style.description === "subStyle") ?? styles?.[1];

	return {
		perkPrimaryStyle: primary?.style ?? null,
		perkKeystone: primary?.selections?.[0]?.perk ?? null,
		perkSubStyle: sub?.style ?? null,
	};
};

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
				...projectPerks(participant.perks?.styles),
				// Riot reports 0 outside Arena rather than omitting the field, and 0
				// is not a placement — normalised so the column means "finished
				// where" and nothing else. The payload keeps the 0 either way.
				placement: participant.placement || null,
			},
		];
	});
};
