import type { IMatchParticipant } from "@/types/riot/i-match-participant.type";

/** A team's combined line, as the scoreboard header states it. */
export interface IMatchTeamTotals {
	kills: number;
	deaths: number;
	assists: number;
	gold: number;
}

/**
 * Sums a team's scoreboard line.
 *
 * Deaths are totalled rather than taken from the other team's kills: they are
 * not the same number. Executions, turret kills and epic monsters all kill a
 * player without crediting anyone, so a team's deaths routinely exceed the
 * opposing kills, and a header that derived one from the other would state a
 * figure the rows beneath it contradict.
 */
export const matchTeamTotals = (
	team: IMatchParticipant[],
): IMatchTeamTotals => {
	const totals: IMatchTeamTotals = {
		kills: 0,
		deaths: 0,
		assists: 0,
		gold: 0,
	};

	for (const player of team) {
		totals.kills += player.kills;
		totals.deaths += player.deaths;
		totals.assists += player.assists;
		totals.gold += player.goldEarned;
	}

	return totals;
};

/** Total creep score, which Riot splits across lane minions and jungle camps. */
export const totalCreepScore = (player: IMatchParticipant) =>
	player.totalMinionsKilled + player.neutralMinionsKilled;
