import { ICON_BASE } from "./constants/icon-base.constant";
import { ITEM_DATA } from "./constants/item-data.constant";
import { ITEM_TAG_FILTERS } from "./constants/item-tag-filter.constant";
import { ITEM_VERSIONS } from "./constants/item-version.constant";
import {
	ALT_MODE_ID_FLOOR,
	CLASSIC_RIFT,
	SUMMONERS_RIFT,
} from "./constants/shop-visibility.constant";
import type { IDDragonRawItem } from "./types/i-ddragon-raw-item.type";
import type { IItemSearch } from "./types/i-item-search.type";
import type { IItemTagFilter } from "./types/i-item-tag-filter.type";
import type { IShopItem } from "./types/i-shop-item.type";
import type { ITierGroup } from "./types/i-tier-group.type";
import type { ItemSort } from "./types/item-sort.type";
import { ITEM_TIERS, type ItemTier } from "./types/item-tier.type";

// Everything the shop does to the bundled Data Dragon asset before it renders:
// which entries are in the shop at all, what an entry becomes, and how the
// filters narrow the result. It moves to the backend later, so every
// JSON-shaped concern stays here and the components only see `IShopItem`.

/**
 * Data Dragon has no tier field, and `depth` alone does not reproduce the
 * shop's headings — the 206 Rift items split 37 / 58 / 111 across absent / 2 /
 * 3. Position in the build tree does: a component is anything that builds into
 * something else, and a finished item is anything that does not.
 *
 * Starters are the exception the tree can't see, so they are taken from the
 * shop's own START tags — narrowed to items that build into nothing, which is
 * what separates Doran's Blade from Long Sword (both tagged `Lane`).
 *
 * The tree disagrees with the client in one place: Dark Seal builds into
 * Mejai's, so it lands in BASIC where the shop files it under STARTER.
 */
export const deriveTier = (item: {
	tags: string[];
	from?: string[];
	into?: string[];
}): ItemTier => {
	const buildsInto = Boolean(item.into?.length);
	if (item.tags.includes("Consumable")) return "CONSUMABLE";
	if (item.tags.includes("Trinket")) return "TRINKET";
	if (
		!buildsInto &&
		(item.tags.includes("Lane") || item.tags.includes("Jungle"))
	)
		return "STARTER";
	if (!item.from?.length) return buildsInto ? "BASIC" : "LEGENDARY";
	return buildsInto ? "EPIC" : "LEGENDARY";
};

/**
 * The one place an asset entry becomes an `IShopItem`: optional id lists are
 * defaulted, the tier derived and the icon URL built against the patch the
 * item was read from, so callers never see Data Dragon's shape.
 */
export const toShopItem = (
	id: string,
	raw: IDDragonRawItem,
	version: string,
): IShopItem => ({
	id,
	name: raw.name,
	description: raw.description,
	colloq: raw.colloq,
	plaintext: raw.plaintext,
	tags: raw.tags,
	stats: raw.stats,
	gold: raw.gold,
	from: raw.from ?? [],
	into: raw.into ?? [],
	depth: raw.depth,
	tier: deriveTier(raw),
	iconUrl: `${ICON_BASE}/${version}/img/item/${raw.image.full}`,
});

/** Whether a patch can be served. Only the bundled asset resolves until the
 * items move to the backend. */
export const isKnownVersion = (version: string) =>
	ITEM_VERSIONS.includes(version);

/**
 * Every item the shop shows for a patch, in Data Dragon's own order. Hidden and
 * unpurchasable entries are dropped here so no caller has to remember to.
 */
export const getShopItems = (
	version: string,
	mapId: string = SUMMONERS_RIFT,
): IShopItem[] => {
	if (!isKnownVersion(version)) return [];
	const shown = Object.entries(ITEM_DATA.data).filter(
		([id, raw]) =>
			Number(id) < ALT_MODE_ID_FLOOR &&
			raw.maps[mapId] &&
			(mapId !== SUMMONERS_RIFT || raw.maps[CLASSIC_RIFT]) &&
			raw.inStore !== false &&
			!raw.hideFromAll &&
			// Champion-locked items (Fiddlesticks' effigy, Kalista's spear — which
			// ships twice, once for Kalista and once for Sylas) are only in the
			// shop for that champion, and there is no champion here.
			!raw.requiredChampion &&
			!raw.requiredAlly,
	);

	// The jungle pets ship as two ids apiece — 1101-1103 and 1105-1107, identical
	// but for the sell price and which maps they appear on — and Data Dragon
	// flags both for the Rift, so the grid would show each pet twice. Nothing in
	// the payload marks one as canonical, so the lower id wins.
	const seen = new Set<string>();
	return shown
		.filter(([, raw]) => {
			if (seen.has(raw.name)) return false;
			seen.add(raw.name);
			return true;
		})
		.map(([id, raw]) => toShopItem(id, raw, version));
};

/**
 * Lookup across the whole patch rather than the shop set: a visible item can
 * build from or into one that the map filter hides, and the detail panel still
 * has to render it.
 */
export const getItem = (version: string, id: string): IShopItem | undefined => {
	if (!isKnownVersion(version)) return undefined;
	const raw = ITEM_DATA.data[id];
	return raw ? toShopItem(id, raw, version) : undefined;
};

/**
 * Narrow the shop set the way the client does: the tier tab and the stat rail
 * intersect, stats stack (an item must satisfy every selected stat, while
 * any one of that stat's tags satisfies it), and the search box matches the
 * name, its aliases and the one-line summary — not the full description, where
 * every stat keyword would match nearly everything.
 */
export const filterItems = (
	items: IShopItem[],
	search: IItemSearch,
): IShopItem[] => {
	const selected = (search.stats ?? [])
		.map((key) => ITEM_TAG_FILTERS.find((stat) => stat.key === key))
		.filter((stat): stat is IItemTagFilter => Boolean(stat));
	const query = search.q?.trim().toLowerCase();

	return items.filter((item) => {
		if (search.tier && item.tier !== search.tier) return false;
		if (
			!selected.every((stat) =>
				stat.tags.some((tag) => item.tags.includes(tag)),
			)
		)
			return false;
		if (!query) return true;
		return (
			item.name.toLowerCase().includes(query) ||
			item.colloq.toLowerCase().includes(query) ||
			item.plaintext.toLowerCase().includes(query)
		);
	});
};

/**
 * Shelve items under their tier heading. Sorting happens inside a group, never
 * across one — the headings are the shop's primary ordering.
 */
export const groupByTier = (
	items: IShopItem[],
	sort: ItemSort = "gold-asc",
): ITierGroup[] => {
	const direction = sort === "gold-desc" ? -1 : 1;
	return ITEM_TIERS.map((tier) => ({
		tier,
		items: items
			.filter((item) => item.tier === tier)
			.sort((a, b) => direction * (a.gold.total - b.gold.total)),
	})).filter((group) => group.items.length > 0);
};
