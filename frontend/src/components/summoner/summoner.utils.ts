import { csPerMinute } from "@/lib/cs-per-minute";
import type { ILeagueEntry } from "@/types/riot/i-league-entry.type";
import type { IMatch } from "@/types/riot/i-match.type";
import type { IMatchParticipant } from "@/types/riot/i-match-participant.type";

/**
 * A riot id in a URL. `#` is a fragment delimiter, so the path uses a hyphen —
 * `/profile/Sneaky-NA69` — the way every other tracker does.
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

/**
 * What someone typed into a search box, split into a riot id. The tag is
 * optional — `Sneaky` and `Sneaky#NA69` both resolve — and defaults to the one
 * region the site serves.
 *
 * Returns null for input that cannot name an account, so a caller can decline
 * to navigate rather than routing to a profile that will 404.
 */
export const parseTypedRiotId = (typed: string, defaultTagLine: string) => {
	const [gameName, tagLine] = typed.trim().split("#");
	if (!gameName) return null;
	return { gameName, tagLine: tagLine || defaultTagLine };
};

/** The queue whose rank a profile leads with. */
export const SOLO_QUEUE = "RANKED_SOLO_5x5";

/** The second ranked queue, shown under solo whether or not it is played. */
export const FLEX_QUEUE = "RANKED_FLEX_SR";

/** Picks solo queue if it is there, else the first queue with any games. */
export const primaryEntry = (entries: ILeagueEntry[]) =>
	entries.find((entry) => entry.queueType === SOLO_QUEUE) ?? entries[0];

/**
 * The entry for one queue, or undefined when the player has not been placed in
 * it. Riot omits unplayed queues entirely rather than returning an empty entry,
 * so the caller renders "Unranked" from the absence.
 */
export const entryForQueue = (entries: ILeagueEntry[], queueType: string) =>
	entries.find((entry) => entry.queueType === queueType);

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

/** The searched player's totals across the matches on screen. */
export interface IRecentRecord {
	games: number;
	wins: number;
	losses: number;
	/** Per-game averages, which is how a scoreboard states a KDA line. */
	kills: number;
	deaths: number;
	assists: number;
	/**
	 * Minions and monsters per minute, averaged over the games rather than over
	 * the total time played: a 45-minute game should not weigh three times a
	 * 15-minute one when the figure is "how well do you farm".
	 */
	csPerMinute: number;
	/** Gold per minute, averaged the same way. */
	goldPerMinute: number;
	/** Vision score per game — a total, not a rate, which is how it is read. */
	visionScore: number;
}

/**
 * Riot omits `challenges` on some payloads — Arena games and anything from
 * before the block was added — where the rest of the participant is intact. A
 * missing block is zero rather than a crash, because it costs one game's
 * contribution to an average instead of the whole profile.
 */
const goldPerMinuteOf = (player: IMatchParticipant) =>
	player.challenges?.goldPerMinute ?? 0;

/**
 * Totals the player's own line across the loaded matches. Averages are per
 * game, not per death — the KDA ratio is derived separately so a deathless
 * sample can say so instead of dividing by zero.
 */
export const recentRecord = (
	matches: IMatch[],
	puuid: string,
): IRecentRecord => {
	const record: IRecentRecord = {
		games: 0,
		wins: 0,
		losses: 0,
		kills: 0,
		deaths: 0,
		assists: 0,
		csPerMinute: 0,
		goldPerMinute: 0,
		visionScore: 0,
	};

	for (const match of matches) {
		const player = match.info.participants.find(
			(participant) => participant.puuid === puuid,
		);
		if (!player) continue;

		record.games += 1;
		record.wins += player.win ? 1 : 0;
		record.losses += player.win ? 0 : 1;
		record.kills += player.kills;
		record.deaths += player.deaths;
		record.assists += player.assists;
		record.csPerMinute += csPerMinute(
			player.totalMinionsKilled + player.neutralMinionsKilled,
			match.info.gameDuration,
		);
		record.goldPerMinute += goldPerMinuteOf(player);
		record.visionScore += player.visionScore;
	}

	if (record.games > 0) {
		record.kills /= record.games;
		record.deaths /= record.games;
		record.assists /= record.games;
		record.csPerMinute /= record.games;
		record.goldPerMinute /= record.games;
		record.visionScore /= record.games;
	}

	return record;
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
