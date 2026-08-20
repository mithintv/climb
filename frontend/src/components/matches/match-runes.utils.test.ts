import runesLibrary from "@assets/runesReforged.json";
import { describe, expect, it } from "vitest";

import { runeIconUrl } from "./match-runes.utils";

/** Every tree and every rune Data Dragon lists — 67 keys in total. */
const RUNE_KEYS = runesLibrary.flatMap((tree) => [
	tree.key,
	...tree.slots.flatMap((slot) => slot.runes.map((rune) => rune.key)),
]);

describe("runeIconUrl", () => {
	// The glob is the only thing tying a rune to its art, and a miss renders as a
	// blank image rather than an error — so nothing else would catch a file that
	// was never downloaded, or a Vite config change that stopped matching them.
	it.each(RUNE_KEYS)("resolves a bundled icon for %s", (key) => {
		expect(runeIconUrl(key)).toBeTruthy();
	});

	it("covers the whole library and nothing collides", () => {
		expect(RUNE_KEYS).toHaveLength(67);
		expect(new Set(RUNE_KEYS.map(runeIconUrl)).size).toBe(67);
	});

	it("returns undefined for a rune with no committed art", () => {
		// Callers skip the image rather than falling back to the CDN, so a missing
		// file stays visible instead of being silently papered over.
		expect(runeIconUrl("ARuneThatDoesNotExist")).toBeUndefined();
	});
});
