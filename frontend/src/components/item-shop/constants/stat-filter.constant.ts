import type { IStatFilter } from "../types/i-stat-filter.type";

/**
 * The stat rail, in the client's own order and grouping — offence, magic, then
 * defence and utility, split by a rule. The client filters on these 14 stats
 * where Data Dragon carries 32 tags, so a stat collects every tag that means
 * it; the tags describing no stat (Vision, Jungle, GoldPer…) have no rail
 * entry, and are reached through the tier tabs and the search box.
 */
export const STAT_FILTER_GROUPS: IStatFilter[][] = [
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

/** The rail flattened, for looking a filter up by the key the URL carries. */
export const STAT_FILTERS: IStatFilter[] = STAT_FILTER_GROUPS.flat();
