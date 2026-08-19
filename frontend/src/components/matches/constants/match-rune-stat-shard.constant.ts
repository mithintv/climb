import abilityHasteIcon from "@/assets/icons/stat-shards/ability-haste.png?url";
import adaptiveForceIcon from "@/assets/icons/stat-shards/adaptive-force.png?url";
import armorIcon from "@/assets/icons/stat-shards/armor.png?url";
import attackSpeedIcon from "@/assets/icons/stat-shards/attack-speed.png?url";
import healthIcon from "@/assets/icons/stat-shards/health.png?url";
import healthScalingIcon from "@/assets/icons/stat-shards/health-scaling.png?url";
import magicResistIcon from "@/assets/icons/stat-shards/magic-resist.png?url";
import moveSpeedIcon from "@/assets/icons/stat-shards/move-speed.png?url";
import resistScalingIcon from "@/assets/icons/stat-shards/resist-scaling.png?url";
import tenacityIcon from "@/assets/icons/stat-shards/tenacity.png?url";

/**
 * The stat shards under the rune trees. Riot ships these in `perks.statPerks`
 * as three ids, but unlike the runes themselves they are not in Data Dragon's
 * `runesReforged.json` at all — the names, values and icon files below were read
 * off CommunityDragon's `v1/perks.json` rather than guessed, because several are
 * not what they look like (tenacity is 15%, not 10%; move speed is 2.5%, not 2%).
 *
 * The icons are Data Dragon's `img/perk-images/StatMods/*` art, committed rather
 * than requested off the CDN per row.
 *
 * All ten shards are listed, including the three defensive ones. A missing id
 * does not degrade to a blank row — the caller drops it — so an incomplete map
 * silently hides shards the player actually took.
 */
export interface IMatchRuneStatShard {
	/** Display name, e.g. "Adaptive Force". */
	name: string;
	/** The magnitude as the game states it, e.g. "+9". */
	value: string;
	/** Bundled icon URL, resolved by Vite at build time. */
	icon: string;
}

export const MATCH_RUNE_STAT_SHARDS: Record<number, IMatchRuneStatShard> = {
	5001: {
		name: "Health Scaling",
		value: "+10-180",
		icon: healthScalingIcon,
	},
	5002: { name: "Armor", value: "+6", icon: armorIcon },
	5003: { name: "Magic Resist", value: "+8", icon: magicResistIcon },
	5005: {
		name: "Attack Speed",
		value: "+10%",
		icon: attackSpeedIcon,
	},
	5007: {
		name: "Ability Haste",
		value: "+8",
		icon: abilityHasteIcon,
	},
	5008: {
		name: "Adaptive Force",
		value: "+9",
		icon: adaptiveForceIcon,
	},
	5010: {
		name: "Move Speed",
		value: "+2.5%",
		icon: moveSpeedIcon,
	},
	5011: { name: "Health", value: "+65", icon: healthIcon },
	5012: {
		name: "Resist Scaling",
		value: "+1-8",
		icon: resistScalingIcon,
	},
	5013: {
		name: "Tenacity and Slow Resist",
		value: "+15%",
		icon: tenacityIcon,
	},
};
