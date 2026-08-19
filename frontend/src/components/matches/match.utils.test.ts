import { describe, expect, it } from "vitest";

import {
	formatDuration,
	formatGold,
	formatRelativeTime,
	kdaRatio,
} from "./match.utils";

describe("formatDuration", () => {
	it("pads the seconds so widths line up in a list", () => {
		expect(formatDuration(1786)).toBe("29:46");
		expect(formatDuration(605)).toBe("10:05");
		expect(formatDuration(59)).toBe("0:59");
	});
});

describe("kdaRatio", () => {
	it("returns null on a deathless game rather than Infinity", () => {
		// The card printed "Infinity KDA" before this guard existed.
		expect(kdaRatio(7, 0, 4)).toBeNull();
	});

	it("counts assists toward the ratio", () => {
		expect(kdaRatio(1, 5, 5)).toBeCloseTo(1.2);
	});
});

describe("formatRelativeTime", () => {
	const now = Date.UTC(2026, 7, 18, 12, 0, 0);
	const ago = (ms: number) => formatRelativeTime(now - ms, now);

	it("describes each bucket", () => {
		expect(ago(30_000)).toBe("just now");
		expect(ago(45 * 60_000)).toBe("45m ago");
		expect(ago(5 * 3_600_000)).toBe("5h ago");
		expect(ago(3 * 86_400_000)).toBe("3d ago");
		// Days run all the way to a month before weeks take over.
		expect(ago(21 * 86_400_000)).toBe("21d ago");
		expect(ago(45 * 86_400_000)).toBe("6w ago");
		expect(ago(400 * 86_400_000)).toBe("13mo ago");
	});

	it("clamps a future timestamp instead of counting up", () => {
		expect(formatRelativeTime(now + 60_000, now)).toBe("just now");
	});
});

describe("formatGold", () => {
	it("abbreviates past a thousand so the column keeps one width", () => {
		expect(formatGold(14231)).toBe("14.2k");
		expect(formatGold(950)).toBe("950");
	});
});
