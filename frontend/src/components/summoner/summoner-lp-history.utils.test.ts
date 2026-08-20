import { describe, expect, it } from "vitest";

import {
	formatLp,
	formatLpDelta,
	lpChartGeometry,
} from "./summoner-lp-history.utils";

describe("lpChartGeometry", () => {
	it("spreads the series across the full width and pins min and max to the band", () => {
		const geometry = lpChartGeometry([10, 20, 30]);
		expect(geometry?.line).toBe("0,94 150,52 300,10");
	});

	it("closes the area down to the baseline at both ends", () => {
		const geometry = lpChartGeometry([10, 20, 30]);
		expect(geometry?.area).toBe("0,100 0,94 150,52 300,10 300,100");
	});

	it("marks the last reading, not the highest one", () => {
		const geometry = lpChartGeometry([10, 30, 20]);
		expect(geometry?.last).toEqual({ x: 300, y: 52 });
	});

	it("draws a flat series down the middle rather than dividing by a zero span", () => {
		const geometry = lpChartGeometry([50, 50, 50]);
		expect(geometry?.line).toBe("0,52 150,52 300,52");
	});

	it("puts a lone reading at the newest end of the axis", () => {
		expect(lpChartGeometry([50])?.line).toBe("300,52");
	});

	it("is null for an empty series, so the caller can show its empty state", () => {
		expect(lpChartGeometry([])).toBeNull();
	});
});

describe("formatLp", () => {
	it("groups thousands, which is where LP totals live", () => {
		expect(formatLp(1247)).toBe("1,247 LP");
	});
});

describe("formatLpDelta", () => {
	it("signs a climb", () => {
		expect(formatLpDelta([1247, 1359])).toBe("+112 LP");
	});

	it("signs a fall", () => {
		expect(formatLpDelta([1359, 1247])).toBe("−112 LP");
	});

	it("reads as no change when the series ends where it started", () => {
		expect(formatLpDelta([100, 200, 100])).toBe("±0 LP");
	});

	it("has no delta to state from a single reading", () => {
		expect(formatLpDelta([100])).toBe("±0 LP");
	});
});
