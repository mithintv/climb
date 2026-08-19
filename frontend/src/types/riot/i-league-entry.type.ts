/** One league-v4 entry: a player's standing in a single ranked queue. */
export interface ILeagueEntry {
	/** "RANKED_SOLO_5x5", "RANKED_FLEX_SR", and occasional novelty queues. */
	queueType: string;
	/** "IRON" … "CHALLENGER". */
	tier: string;
	/** "IV" … "I". Always "I" for Master and above, which have no divisions. */
	rank: string;
	leaguePoints: number;
	wins: number;
	losses: number;
}
