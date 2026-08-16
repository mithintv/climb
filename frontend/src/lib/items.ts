import itemFile from "@assets/item.json";

// The whole page reads items through this module. Items live in the bundled
// Data Dragon doc for now and move to the backend later, so every JSON-shaped
// concern — visibility rules, tier derivation, icon URLs — is resolved here and
// the components only ever see `ShopItem`.

/** The Data Dragon patch bundled at `backend/assets/item.json`. */
export const ITEM_VERSION: string = itemFile.version;

/** `maps` key for Summoner's Rift, the only map the shop is scoped to today. */
export const SUMMONERS_RIFT = "11";

/**
 * `maps` key for Classic Rift, required alongside Summoner's Rift.
 *
 * Data Dragon's `maps` flag means "enabled on this map", not "in this map's
 * shop", so map 11 alone pulls in items only reachable there through another
 * queue — the four Guardian's starters and Cappa Juice. Nothing in Data Dragon
 * or CommunityDragon marks the real shop list (CommunityDragon's items.json
 * has no `maps` at all), but those five are the only entries flagged for the
 * Rift and not for classic play, so the pair of flags separates them.
 */
const CLASSIC_RIFT = "453";

export const SUMMONERS_RIFT_LABEL = "Summoner's Rift";

/**
 * Patches the page can serve, newest first. Only the bundled doc resolves until
 * items move to the backend, so this is a list of one — the picker is built
 * against the list rather than the constant so adding patches is data.
 */
export const ITEM_VERSIONS: string[] = [itemFile.version];

// Alternate modes (Arena, Swarm, …) ship copies of Rift items under six-digit
// ids that still flag `maps["11"]`, which would duplicate ~35 names in the
// grid. The canonical shop lives in the five-digit id space.
const ALT_MODE_ID_FLOOR = 100_000;

const ICON_BASE = "https://ddragon.leagueoflegends.com/cdn";

interface RawItem {
	name: string;
	description: string;
	colloq: string;
	plaintext: string;
	image: { full: string };
	gold: { base: number; total: number; sell: number; purchasable: boolean };
	tags: string[];
	maps: Record<string, boolean>;
	stats: Record<string, number>;
	from?: string[];
	into?: string[];
	depth?: number;
	inStore?: boolean;
	hideFromAll?: boolean;
	requiredChampion?: string;
	requiredAlly?: string;
}

interface RawItemFile {
	version: string;
	data: Record<string, RawItem>;
	tree: { header: string; tags: string[] }[];
}

// item.json is 868 entries deep; inferring a literal type per entry costs more
// than it tells us, so the shape is declared once above.
const items = itemFile as unknown as RawItemFile;

/**
 * The shop's own headings, in display order. `Consumable` and `Trinket` are
 * tags rather than build tiers, but the shop groups them the same way.
 */
export const ITEM_TIERS = [
	"STARTER",
	"BASIC",
	"EPIC",
	"LEGENDARY",
	"CONSUMABLE",
	"TRINKET",
] as const;

export type ItemTier = (typeof ITEM_TIERS)[number];

export interface ShopItem {
	id: string;
	name: string;
	description: string;
	colloq: string;
	plaintext: string;
	tags: string[];
	stats: Record<string, number>;
	gold: RawItem["gold"];
	from: string[];
	into: string[];
	depth: number | undefined;
	tier: ItemTier;
	iconUrl: string;
}

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

const toShopItem = (id: string, raw: RawItem, version: string): ShopItem => ({
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

/** Whether a patch can be served. Only the bundled doc resolves until the
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
): ShopItem[] => {
	if (!isKnownVersion(version)) return [];
	const shown = Object.entries(items.data).filter(
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
export const getItem = (version: string, id: string): ShopItem | undefined => {
	if (!isKnownVersion(version)) return undefined;
	const raw = items.data[id];
	return raw ? toShopItem(id, raw, version) : undefined;
};

export type ItemSort = "gold-asc" | "gold-desc";

export interface StatFilter {
	/** Stable key; this is what travels in the URL. */
	key: string;
	label: string;
	/** The Data Dragon tags this stat collects. */
	tags: string[];
}

/**
 * The rail, in the client's own order and grouping — offence, magic, then
 * defence and utility, split by a rule. The client filters on these 14 stats
 * where Data Dragon carries 32 tags, so a stat collects every tag that means
 * it; the tags describing no stat (Vision, Jungle, GoldPer…) have no rail
 * entry, and are reached through the tier tabs and the search box.
 */
export const STAT_FILTER_GROUPS: StatFilter[][] = [
	[
		{ key: "attack-damage", label: "Attack Damage", tags: ["Damage"] },
		{
			key: "critical-strike",
			label: "Critical Strike",
			tags: ["CriticalStrike"],
		},
		{ key: "attack-speed", label: "Attack Speed", tags: ["AttackSpeed"] },
		{ key: "on-hit", label: "On-Hit", tags: ["OnHit"] },
		{
			key: "armor-penetration",
			label: "Armor Penetration",
			tags: ["ArmorPenetration"],
		},
	],
	[
		{ key: "ability-power", label: "Ability Power", tags: ["SpellDamage"] },
		{ key: "mana", label: "Mana", tags: ["Mana", "ManaRegen"] },
		{
			key: "magic-penetration",
			label: "Magic Penetration",
			tags: ["MagicPenetration"],
		},
	],
	[
		{ key: "health", label: "Health", tags: ["Health", "HealthRegen"] },
		{ key: "armor", label: "Armor", tags: ["Armor"] },
		{
			key: "magic-resistance",
			label: "Magic Resistance",
			tags: ["SpellBlock", "MagicResist"],
		},
		{
			key: "ability-haste",
			label: "Ability Haste",
			tags: ["AbilityHaste", "CooldownReduction"],
		},
		{
			key: "movement",
			label: "Movement",
			tags: ["Boots", "NonbootsMovement"],
		},
		{
			key: "life-steal",
			label: "Life Steal",
			tags: ["LifeSteal", "SpellVamp"],
		},
	],
];

export const STAT_FILTERS: StatFilter[] = STAT_FILTER_GROUPS.flat();

const TIER_LABELS: Record<ItemTier, string> = {
	CONSUMABLE: "Consumables",
	TRINKET: "Trinkets",
	STARTER: "Starter",
	BASIC: "Basic",
	EPIC: "Epic",
	LEGENDARY: "Legendary",
};

/**
 * The tier tabs across the top, in `ITEM_TIERS` order so a tab and the heading
 * it scopes to always agree. `undefined` is the all-items tab.
 */
export const TIER_TABS: { tier: ItemTier | undefined; label: string }[] = [
	{ tier: undefined, label: "All" },
	...ITEM_TIERS.map((tier) => ({ tier, label: TIER_LABELS[tier] })),
];

/** Everything the grid reads out of the URL. */
export interface ItemSearch {
	q?: string;
	tier?: ItemTier;
	stats?: string[];
	sort?: ItemSort;
	item?: string;
}

export interface TierGroup {
	tier: ItemTier;
	items: ShopItem[];
}

/**
 * Narrow the shop set the way the client does: the tier tab and the stat rail
 * intersect, stats stack (an item must satisfy every selected stat, while
 * any one of that stat's tags satisfies it), and the search box matches the
 * name, its aliases and the one-line summary — not the full description, where
 * every stat keyword would match nearly everything.
 */
export const filterItems = (
	items: ShopItem[],
	search: ItemSearch,
): ShopItem[] => {
	const selected = (search.stats ?? [])
		.map((key) => STAT_FILTERS.find((stat) => stat.key === key))
		.filter((stat): stat is StatFilter => Boolean(stat));
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
	items: ShopItem[],
	sort: ItemSort = "gold-asc",
): TierGroup[] => {
	const direction = sort === "gold-desc" ? -1 : 1;
	return ITEM_TIERS.map((tier) => ({
		tier,
		items: items
			.filter((item) => item.tier === tier)
			.sort((a, b) => direction * (a.gold.total - b.gold.total)),
	})).filter((group) => group.items.length > 0);
};
