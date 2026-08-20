/**
 * Where a perk's art lives, as a path under `frontend/src/assets/`.
 *
 * The icons are committed to the frontend rather than hotlinked off Data
 * Dragon, so `perks.icon` records where the app will find them rather than
 * Data Dragon's own `perk-images/Styles/…` path. The filenames are derived from
 * each perk's Data Dragon `key` — the same derivation that named the files when
 * they were downloaded — so adding a rune means dropping in one more file, with
 * nothing here to update.
 *
 * Stat shards live in their own directory because they came from a different
 * source: Data Dragon does not list them at all.
 */

/** "DarkHarvest" -> "dark-harvest", which is how the files are named. */
const kebabCase = (key: string) =>
	key
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[^A-Za-z0-9]+/g, "-")
		.toLowerCase()
		.replace(/^-|-$/g, "");

/** The committed icon for a rune tree or a rune, e.g. "icons/runes/scorch.png". */
export const runeIconPath = (key: string) =>
	`icons/runes/${kebabCase(key)}.png`;

/** The committed icon for a stat shard, e.g. "icons/stat-shards/tenacity.png". */
export const statPerkIconPath = (key: string) =>
	`icons/stat-shards/${kebabCase(key)}.png`;
