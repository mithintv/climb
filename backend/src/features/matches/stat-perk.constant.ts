/**
 * The ten stat shards, which Data Dragon does not ship.
 *
 * `runesReforged.json` lists the five trees and their 62 runes and stops there,
 * but a participant's `perks.statPerks` names three more perk ids — so without
 * this list those rows would exist in `perks` with an id and no name.
 *
 * The names and values were read off CommunityDragon's `v1/perks.json` rather
 * than guessed, because several are not what they look like: tenacity is 15%,
 * not 10%, and move speed is 2.5%, not 2%. The frontend carries the same list
 * with its icons in `match-rune-stat-shard.constant.ts`; the duplication goes
 * away when the frontend reads perks from this API instead of a bundled asset.
 */
export const STAT_PERKS = [
	{ id: 5001, key: "HealthScaling", name: "Health Scaling" },
	{ id: 5002, key: "Armor", name: "Armor" },
	{ id: 5003, key: "MagicResist", name: "Magic Resist" },
	{ id: 5005, key: "AttackSpeed", name: "Attack Speed" },
	{ id: 5007, key: "AbilityHaste", name: "Ability Haste" },
	{ id: 5008, key: "AdaptiveForce", name: "Adaptive Force" },
	{ id: 5010, key: "MoveSpeed", name: "Move Speed" },
	{ id: 5011, key: "Health", name: "Health" },
	{ id: 5012, key: "Tenacity", name: "Tenacity" },
	{ id: 5013, key: "ResistScaling", name: "Resist Scaling" },
] as const;
