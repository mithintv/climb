import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { runeIconPath, statPerkIconPath } from "./perk-icon.utils.ts";
import { STAT_PERKS } from "./stat-perk.constant.ts";
import type { IDDragonRuneTree } from "./types/i-ddragon-rune-tree.type.ts";

/** Where the frontend keeps the committed art the seeded paths point into. */
const asset = (path: string) =>
	fileURLToPath(
		new URL(`./../../../../frontend/src/assets/${path}`, import.meta.url),
	);

const TREES = JSON.parse(
	readFileSync(
		fileURLToPath(
			new URL("./../../../assets/runesReforged.json", import.meta.url),
		),
		"utf8",
	),
) as IDDragonRuneTree[];

const RUNE_KEYS = TREES.flatMap((tree) => [
	tree.key,
	...tree.slots.flatMap((slot) => slot.runes.map((rune) => rune.key)),
]);

describe("runeIconPath", () => {
	it("derives the committed filename from Data Dragon's key", () => {
		expect(runeIconPath("DarkHarvest")).toBe("icons/runes/dark-harvest.png");
		expect(runeIconPath("Domination")).toBe("icons/runes/domination.png");
	});

	// The seed writes these paths into `perks.icon` and nothing checks them at
	// runtime, so a rune whose art was never downloaded would render as a broken
	// image with no error anywhere. This is the check.
	it.each(RUNE_KEYS)("has committed art for %s", (key) => {
		expect(existsSync(asset(runeIconPath(key)))).toBe(true);
	});

	it("covers every tree and rune Data Dragon lists", () => {
		expect(RUNE_KEYS).toHaveLength(67);
		expect(new Set(RUNE_KEYS.map(runeIconPath)).size).toBe(67);
	});
});

describe("statPerkIconPath", () => {
	it.each(STAT_PERKS.map((shard) => shard.key))(
		"has committed art for %s",
		(key) => {
			expect(existsSync(asset(statPerkIconPath(key)))).toBe(true);
		},
	);
});
