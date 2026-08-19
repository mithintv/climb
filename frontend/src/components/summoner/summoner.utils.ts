import type { ILeagueEntry } from "@/types/riot/i-league-entry.type";
import type { IMatch } from "@/types/riot/i-match.type";
import type { IMatchParticipant } from "@/types/riot/i-match-participant.type";

/**
 * A riot id in a URL. `#` is a fragment delimiter, so the path uses a hyphen —
 * `/summoner/Sneaky-NA69` — the way every other tracker does.
 */
export const toRiotIdParam = (gameName: string, tagLine: string) =>
	`${gameName}-${tagLine}`;

/**
 * Splits on the LAST hyphen: riot ids may contain hyphens themselves, but the
 * tag line may not, so only the final segment is ambiguous-free.
 */
export const parseRiotIdParam = (param: string) => {
	const separator = param.lastIndexOf("-");
	if (separator === -1) return { gameName: param, tagLine: "NA1" };
	return {
		gameName: param.slice(0, separator),
		tagLine: param.slice(separator + 1),
	};
};

/** The queue whose rank a profile leads with. */
export const SOLO_QUEUE = "RANKED_SOLO_5x5";

/** Picks solo queue if it is there, else the first queue with any games. */
export const primaryEntry = (entries: ILeagueEntry[]) =>
	entries.find((entry) => entry.queueType === SOLO_QUEUE) ?? entries[0];

/** "DIAMOND" + "I" → "Diamond I". Master and above have no meaningful division. */
export const formatRank = (entry: ILeagueEntry) => {
	const tier = entry.tier.charAt(0) + entry.tier.slice(1).toLowerCase();
	const divisionless = ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(
		entry.tier,
	);
	return divisionless ? tier : `${tier} ${entry.rank}`;
};

/** Games played, as a whole number percentage. Returns null with no games. */
export const winRate = (wins: number, losses: number) => {
	const games = wins + losses;
	return games === 0 ? null : Math.round((wins / games) * 100);
};

/** One champion's record across the matches on screen. */
export interface IChampionStat {
	championName: string;
	games: number;
	wins: number;
	kills: number;
	deaths: number;
	assists: number;
}

/**
 * Aggregates the searched player's own line from each match. This is only ever
 * the sample currently loaded — a handful of games — so it is labelled as
 * "recent" rather than presented as a season record.
 */
export const championStats = (
	matches: IMatch[],
	puuid: string,
): IChampionStat[] => {
	const byChampion = new Map<string, IChampionStat>();

	for (const match of matches) {
		const player: IMatchParticipant | undefined = match.info.participants.find(
			(participant) => participant.puuid === puuid,
		);
		if (!player) continue;

		const stat = byChampion.get(player.championName) ?? {
			championName: player.championName,
			games: 0,
			wins: 0,
			kills: 0,
			deaths: 0,
			assists: 0,
		};

		stat.games += 1;
		stat.wins += player.win ? 1 : 0;
		stat.kills += player.kills;
		stat.deaths += player.deaths;
		stat.assists += player.assists;
		byChampion.set(player.championName, stat);
	}

	// Most played first, then most wins — a 3-game champion outranks a 1-game one
	// however well the single game went.
	return [...byChampion.values()].sort(
		(a, b) => b.games - a.games || b.wins - a.wins,
	);
};
