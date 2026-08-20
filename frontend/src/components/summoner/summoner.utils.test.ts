import { describe, expect, it } from "vitest";

import type { ILeagueEntry } from "@/types/riot/i-league-entry.type";
import type { IMatch } from "@/types/riot/i-match.type";
import type { IMatchParticipant } from "@/types/riot/i-match-participant.type";

import {
	championStats,
	entryForQueue,
	formatRank,
	parseRiotIdParam,
	parseTypedRiotId,
	primaryEntry,
	recentRecord,
	toRiotIdParam,
	winRate,
} from "./summoner.utils";

const entry = (over: Partial<ILeagueEntry>): ILeagueEntry => ({
	queueType: "RANKED_SOLO_5x5",
	tier: "DIAMOND",
	rank: "I",
	leaguePoints: 55,
	wins: 10,
	losses: 10,
	...over,
});

const match = (
	puuid: string,
	championName: string,
	over: Partial<IMatchParticipant> = {},
	gameDuration = 1800,
): IMatch =>
	({
		info: {
			gameDuration,
			participants: [
				{
					puuid,
					championName,
					win: true,
					kills: 5,
					deaths: 2,
					assists: 7,
					totalMinionsKilled: 100,
					neutralMinionsKilled: 20,
					visionScore: 30,
					challenges: { goldPerMinute: 400 },
					...over,
				} as IMatchParticipant,
			],
		},
	}) as IMatch;

describe("riot id params", () => {
	it("round-trips a plain riot id", () => {
		expect(parseRiotIdParam(toRiotIdParam("Sneaky", "NA69"))).toEqual({
			gameName: "Sneaky",
			tagLine: "NA69",
		});
	});

	it("splits on the last hyphen, so a hyphenated name survives", () => {
		expect(parseRiotIdParam("Big-Bad-Wolf-NA1")).toEqual({
			gameName: "Big-Bad-Wolf",
			tagLine: "NA1",
		});
	});

	it("defaults the tag when none is present", () => {
		expect(parseRiotIdParam("Sneaky").tagLine).toBe("NA1");
	});
});

describe("primaryEntry", () => {
	it("prefers solo queue over a queue that happens to sort first", () => {
		// league-v4 really does return novelty queues, and ahead of solo.
		const entries = [
			entry({ queueType: "JADE_RANKED_SOLO_5x5", tier: "WOOD" }),
			entry({ queueType: "RANKED_SOLO_5x5" }),
		];
		expect(primaryEntry(entries)?.queueType).toBe("RANKED_SOLO_5x5");
	});

	it("is undefined for an unranked account", () => {
		expect(primaryEntry([])).toBeUndefined();
	});
});

describe("formatRank", () => {
	it("keeps the division below master", () => {
		expect(formatRank(entry({ tier: "EMERALD", rank: "III" }))).toBe(
			"Emerald III",
		);
	});

	it("drops the division at master and above, where it is meaningless", () => {
		expect(formatRank(entry({ tier: "CHALLENGER", rank: "I" }))).toBe(
			"Challenger",
		);
	});
});

describe("winRate", () => {
	it("rounds to a whole percent", () => {
		expect(winRate(267, 257)).toBe(51);
	});

	it("is null with no games rather than NaN", () => {
		expect(winRate(0, 0)).toBeNull();
	});
});

describe("championStats", () => {
	it("aggregates the searched player's line only", () => {
		const stats = championStats(
			[
				match("me", "Ashe"),
				match("me", "Ashe", { win: false, kills: 1, deaths: 4, assists: 2 }),
				match("me", "Jinx"),
				match("someone-else", "Ashe"),
			],
			"me",
		);

		expect(stats).toHaveLength(2);
		const ashe = stats[0];
		expect(ashe.championName).toBe("Ashe");
		expect(ashe.games).toBe(2);
		expect(ashe.wins).toBe(1);
		expect(ashe.kills).toBe(6);
		expect(ashe.deaths).toBe(6);
	});

	it("sorts by games played, not by how well one game went", () => {
		const stats = championStats(
			[
				match("me", "Jinx", { kills: 20 }),
				match("me", "Ashe"),
				match("me", "Ashe"),
			],
			"me",
		);
		expect(stats.map((stat) => stat.championName)).toEqual(["Ashe", "Jinx"]);
	});

	it("returns nothing when the player is in none of the matches", () => {
		expect(championStats([match("other", "Ashe")], "me")).toEqual([]);
	});
});

describe("entryForQueue", () => {
	it("finds the entry for a queue the player is placed in", () => {
		const entries = [entry({ queueType: "RANKED_FLEX_SR", tier: "GOLD" })];
		expect(entryForQueue(entries, "RANKED_FLEX_SR")?.tier).toBe("GOLD");
	});

	it("returns undefined for a queue Riot omitted, which reads as unranked", () => {
		expect(entryForQueue([entry({})], "RANKED_FLEX_SR")).toBeUndefined();
	});
});

describe("recentRecord", () => {
	it("totals wins and losses and averages the kda line per game", () => {
		const record = recentRecord(
			[
				match("me", "Ashe", { win: true, kills: 10, deaths: 2, assists: 4 }),
				match("me", "Jinx", { win: false, kills: 4, deaths: 8, assists: 2 }),
			],
			"me",
		);

		expect(record.games).toBe(2);
		expect(record.wins).toBe(1);
		expect(record.losses).toBe(1);
		expect(record.kills).toBe(7);
		expect(record.deaths).toBe(5);
		expect(record.assists).toBe(3);
	});

	it("leaves the averages at zero rather than dividing by no games", () => {
		const record = recentRecord([match("other", "Ashe")], "me");
		expect(record.games).toBe(0);
		expect(record.deaths).toBe(0);
		expect(record.csPerMinute).toBe(0);
		expect(record.goldPerMinute).toBe(0);
	});

	it("averages the rates per game, not over the total time played", () => {
		// 120 cs in 30 min is 4.0/min; 120 cs in 15 min is 8.0/min. Averaged per
		// game that is 6.0 — weighting by time would give 5.33 and let the long
		// game speak for twice as much of the figure.
		const record = recentRecord(
			[match("me", "Ashe", {}, 1800), match("me", "Ashe", {}, 900)],
			"me",
		);
		expect(record.csPerMinute).toBeCloseTo(6, 5);
	});

	it("averages vision as a per-game total rather than a rate", () => {
		const record = recentRecord(
			[
				match("me", "Ashe", { visionScore: 20 }),
				match("me", "Ashe", { visionScore: 40 }),
			],
			"me",
		);
		expect(record.visionScore).toBe(30);
	});

	it("counts a payload with no challenges block as zero gold rate, not NaN", () => {
		const record = recentRecord(
			[
				match("me", "Ashe", {
					challenges: undefined as unknown as IMatchParticipant["challenges"],
				}),
				match("me", "Ashe", { challenges: { goldPerMinute: 400 } }),
			],
			"me",
		);
		expect(record.goldPerMinute).toBe(200);
	});

	it("ignores a remake reporting no duration instead of dividing by zero", () => {
		const record = recentRecord([match("me", "Ashe", {}, 0)], "me");
		expect(record.csPerMinute).toBe(0);
	});
});

describe("parseTypedRiotId", () => {
	it("splits a typed riot id on the hash", () => {
		expect(parseTypedRiotId("Sneaky#NA69", "NA1")).toEqual({
			gameName: "Sneaky",
			tagLine: "NA69",
		});
	});

	it("defaults the tag when the box was left without one", () => {
		expect(parseTypedRiotId("Sneaky", "NA1")?.tagLine).toBe("NA1");
	});

	it("defaults the tag when the hash was typed but nothing after it", () => {
		expect(parseTypedRiotId("Sneaky#", "NA1")?.tagLine).toBe("NA1");
	});

	it("is null for input that names no account, so the caller does not navigate", () => {
		expect(parseTypedRiotId("   ", "NA1")).toBeNull();
		expect(parseTypedRiotId("#NA1", "NA1")).toBeNull();
	});
});
