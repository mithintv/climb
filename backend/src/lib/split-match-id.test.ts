import { describe, expect, it } from "vitest";

import { splitMatchId } from "./split-match-id.ts";

describe("splitMatchId", () => {
	it("splits an id into its platform and game id", () => {
		expect(splitMatchId("NA1_5607525822")).toEqual({
			platformId: "NA1",
			gameId: 5_607_525_822,
		});
	});

	it("keeps the game id an exact number", () => {
		// It is the sort key the whole index orders on, and it is past 2^32 on
		// live shards — a lossy parse would order two adjacent games wrongly.
		const { gameId } = splitMatchId("NA1_5607525822");

		expect(Number.isSafeInteger(gameId)).toBe(true);
		expect(String(gameId)).toBe("5607525822");
	});

	it("rejects an id with no platform", () => {
		expect(() => splitMatchId("5607525822")).toThrow(/Not a match id/);
		expect(() => splitMatchId("_5607525822")).toThrow(/Not a match id/);
	});

	it("rejects an id whose game component is not a number", () => {
		expect(() => splitMatchId("NA1_")).toThrow(/Not a match id/);
		expect(() => splitMatchId("NA1_abc")).toThrow(/Not a match id/);
	});
});
