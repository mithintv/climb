import { describe, expect, it } from "vitest";

import { csPerMinute } from "./cs-per-minute";

describe("csPerMinute", () => {
	it("states creep score as a rate over the game's minutes", () => {
		expect(csPerMinute(240, 1800)).toBe(8);
	});

	it("is zero for a game with no duration rather than infinite", () => {
		expect(csPerMinute(240, 0)).toBe(0);
	});
});
