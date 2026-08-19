/**
 * The stat shards under the rune trees. Riot ships these in `perks.statPerks`
 * as three ids, but unlike the runes themselves they are not in Data Dragon's
 * `runesReforged.json` at all — the names, values and icon files below were read
 * off CommunityDragon's `v1/perks.json` rather than guessed, because several are
 * not what they look like (tenacity is 15%, not 10%; move speed is 2.5%, not 2%).
 *
 * Every icon resolves on Data Dragon's unversioned rune path, so nothing here
 * needs a second CDN.
 */
export interface IStatShard {
	/** Display name, e.g. "Adaptive Force". */
	name: string;
	/** The magnitude as the game states it, e.g. "+9". */
	value: string;
	/** Filename under `cdn/img/perk-images/StatMods/`. */
	icon: string;
}

export const STAT_SHARDS: Record<number, IStatShard> = {
	5001: {
		name: "Health Scaling",
		value: "+10-180",
		icon: "StatModsHealthPlusIcon.png",
	},
	5005: {
		name: "Attack Speed",
		value: "+10%",
		icon: "StatModsAttackSpeedIcon.png",
	},
	5007: {
		name: "Ability Haste",
		value: "+8",
		icon: "StatModsCDRScalingIcon.png",
	},
	5008: {
		name: "Adaptive Force",
		value: "+9",
		icon: "StatModsAdaptiveForceIcon.png",
	},
	5010: {
		name: "Move Speed",
		value: "+2.5%",
		icon: "StatModsMovementSpeedIcon.png",
	},
	5011: { name: "Health", value: "+65", icon: "StatModsHealthScalingIcon.png" },
	5013: {
		name: "Tenacity and Slow Resist",
		value: "+15%",
		icon: "StatModsTenacityIcon.png",
	},
};

/** Icons live on the same unversioned path as the rune icons. */
export const statShardImage = (shard: IStatShard) =>
	`https://ddragon.leagueoflegends.com/cdn/img/perk-images/StatMods/${shard.icon}`;
