import { describe, expect, it } from "vitest";

import type { IMatchParticipant } from "@/types/riot/i-match-participant.type";

import { matchTeamTotals, totalCreepScore } from "./match-scoreboard.utils";

const player = (over: Partial<IMatchParticipant> = {}): IMatchParticipant =>
	({
		kills: 2,
		deaths: 3,
		assists: 5,
		goldEarned: 10_000,
		totalMinionsKilled: 150,
		neutralMinionsKilled: 20,
		...over,
	}) as IMatchParticipant;

describe("matchTeamTotals", () => {
	it("sums the whole team's line", () => {
		const totals = matchTeamTotals([
			player({ kills: 1, deaths: 2, assists: 3, goldEarned: 9000 }),
			player({ kills: 4, deaths: 0, assists: 7, goldEarned: 12_500 }),
		]);

		expect(totals).toEqual({
			kills: 5,
			deaths: 2,
			assists: 10,
			gold: 21_500,
		});
	});

	it("totals deaths independently, since a team can die without anyone being credited", () => {
		// An execution or a turret kill is a death with no opposing kill behind it,
		// so deaths must come from the team's own rows.
		const totals = matchTeamTotals([
			player({ deaths: 4 }),
			player({ deaths: 6 }),
		]);
		expect(totals.deaths).toBe(10);
	});

	it("is all zeroes for a side with no players rather than NaN", () => {
		expect(matchTeamTotals([])).toEqual({
			kills: 0,
			deaths: 0,
			assists: 0,
			gold: 0,
		});
	});
});

describe("totalCreepScore", () => {
	it("adds the jungle camps Riot reports separately from lane minions", () => {
		expect(
			totalCreepScore(
				player({ totalMinionsKilled: 180, neutralMinionsKilled: 42 }),
			),
		).toBe(222);
	});
});
