import { describe, expect, it } from "vitest";

import { ITEM_VERSION } from "./constants/item-version.constant";
import {
	STAT_FILTER_GROUPS,
	STAT_FILTERS,
} from "./constants/stat-filter.constant";
import { ITEM_TIER_TABS } from "./item-filters/item-tier-tab.constant";
import { filterItems, getItem, getShopItems } from "./item-shop.utils";
import type { ItemTier } from "./types/item-tier.type";

// Pinned to the bundled patch. A patch bump that reshuffles the build tree is
// expected to move these numbers — the point is that it does so visibly.
describe(`shop items at ${ITEM_VERSION}`, () => {
	const shop = getShopItems(ITEM_VERSION);

	it("resolves only the bundled patch", () => {
		expect(shop.length).toBe(206);
		expect(getShopItems("15.1.1")).toEqual([]);
	});

	it("leaves out items on the Rift but not in classic play", () => {
		// maps["11"] means "enabled here", not "in this shop": the Guardian's
		// starters and Cappa Juice carry it without being in the Rift shop, and
		// are the only entries flagged for 11 but not for Classic Rift.
		const ids = new Set(shop.map((item) => item.id));
		for (const id of ["2051", "3112", "3177", "3184", "2141"]) {
			expect(ids.has(id)).toBe(false);
		}
		// The pairing is a heuristic, so pin what it keeps: these read as Rift
		// items and survive it.
		for (const id of ["1120", "2022"]) expect(ids.has(id)).toBe(true);
	});

	it("shows each item once", () => {
		// The jungle pets ship under two ids apiece and Kalista's spear under
		// two champions, all flagged for the Rift.
		const names = shop.map((item) => item.name);
		expect(new Set(names).size).toBe(names.length);
	});

	it("leaves out items locked to a champion", () => {
		// Kalista's spear (3599/3600) and Fiddlesticks' effigy (3330).
		const ids = new Set(shop.map((item) => item.id));
		expect(ids.has("3599")).toBe(false);
		expect(ids.has("3600")).toBe(false);
		expect(ids.has("3330")).toBe(false);
	});

	it("drops the alternate-mode copies that duplicate Rift items", () => {
		// Arena/Swarm ship six-digit copies that still flag maps["11"].
		expect(shop.every((item) => Number(item.id) < 100_000)).toBe(true);
		expect(
			shop.filter((item) => item.name === "Shurelya's Battlesong"),
		).toHaveLength(1);
	});

	it("groups every item into a tier", () => {
		const counts = shop.reduce<Record<string, number>>((acc, item) => {
			acc[item.tier] = (acc[item.tier] ?? 0) + 1;
			return acc;
		}, {});
		expect(counts).toEqual({
			STARTER: 15,
			BASIC: 18,
			EPIC: 51,
			LEGENDARY: 113,
			CONSUMABLE: 6,
			TRINKET: 3,
		});
	});

	// The mapping the ticket calls out: `depth` alone cannot produce these, so
	// each tier is pinned to an item whose shelf in the client is unambiguous.
	it.each<[string, string, ItemTier]>([
		["1055", "Doran's Blade", "STARTER"],
		["1036", "Long Sword", "BASIC"],
		["1001", "Boots", "BASIC"],
		["3057", "Sheen", "EPIC"],
		["3006", "Berserker's Greaves", "EPIC"],
		["3031", "Infinity Edge", "LEGENDARY"],
		["2003", "Health Potion", "CONSUMABLE"],
		["3340", "Stealth Ward", "TRINKET"],
	])("files %s (%s) under %s", (id, name, tier) => {
		const item = getItem(ITEM_VERSION, id);
		expect(item?.name).toBe(name);
		expect(item?.tier).toBe(tier);
	});

	it("separates starters from components sharing the Lane tag", () => {
		const dorans = getItem(ITEM_VERSION, "1055");
		const longSword = getItem(ITEM_VERSION, "1036");
		expect(dorans?.tags).toContain("Lane");
		expect(longSword?.tags).toContain("Lane");
		expect(dorans?.into).toEqual([]);
		expect(longSword?.into.length).toBeGreaterThan(0);
	});

	it("resolves items the map filter hides, for the build tree", () => {
		// Every component and upgrade a visible item points at has to render in
		// the detail panel, whether or not it is in the shop set itself.
		const ids = new Set(shop.map((item) => item.id));
		const missing = shop
			.flatMap((item) => [...item.from, ...item.into])
			.filter((id) => !ids.has(id) && !getItem(ITEM_VERSION, id));
		expect(missing).toEqual([]);
	});
});

describe("filters", () => {
	const shop = getShopItems(ITEM_VERSION);

	it("keeps the rail in the client's order and grouping", () => {
		expect(STAT_FILTER_GROUPS.map((group) => group.length)).toEqual([5, 3, 6]);
		expect(STAT_FILTERS.map((stat) => stat.key)).toEqual([
			"attack-damage",
			"critical-strike",
			"attack-speed",
			"on-hit",
			"armor-penetration",
			"ability-power",
			"mana",
			"magic-penetration",
			"health",
			"armor",
			"magic-resistance",
			"ability-haste",
			"movement",
			"life-steal",
		]);
	});

	it("gives every stat a tag that exists and matches items", () => {
		// A typo in a stat's tag list would silently filter to nothing.
		const inData = new Set(shop.flatMap((item) => item.tags));
		for (const stat of STAT_FILTERS) {
			expect(stat.tags.every((tag) => inData.has(tag))).toBe(true);
			expect(filterItems(shop, { stats: [stat.key] }).length).toBeGreaterThan(
				0,
			);
		}
	});

	it("stacks stats but takes any tag within one", () => {
		// Movement collects Boots and NonbootsMovement: an item needs either, so
		// the stat matches more items than either tag alone.
		const movement = filterItems(shop, { stats: ["movement"] });
		const boots = shop.filter((item) => item.tags.includes("Boots"));
		expect(movement.length).toBeGreaterThan(boots.length);

		// Two stats intersect rather than union.
		const both = filterItems(shop, { stats: ["movement", "armor"] });
		expect(both.length).toBeLessThan(movement.length);
		expect(
			both.every(
				(item) =>
					item.tags.includes("Armor") &&
					(item.tags.includes("Boots") ||
						item.tags.includes("NonbootsMovement")),
			),
		).toBe(true);
	});

	it("scopes to one tier per tab", () => {
		for (const tab of ITEM_TIER_TABS) {
			const shown = filterItems(shop, { tier: tab.tier });
			if (!tab.tier) {
				expect(shown).toHaveLength(shop.length);
				continue;
			}
			expect(shown.length).toBeGreaterThan(0);
			expect(shown.every((item) => item.tier === tab.tier)).toBe(true);
		}
	});

	it("searches names, aliases and summaries, not descriptions", () => {
		expect(
			filterItems(shop, { q: "doran" }).map((item) => item.name),
		).toContain("Doran's Blade");
		// The one-line summary is searchable...
		expect(filterItems(shop, { q: "attack damage" }).length).toBeGreaterThan(0);
		// ...the marked-up description is not, or its tag names would match.
		expect(filterItems(shop, { q: "mainText" })).toEqual([]);
	});
});
