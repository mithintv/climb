/**
 * Every committed rune icon, resolved at build time.
 *
 * A glob rather than 67 static imports, and eager so the URLs are plain strings
 * by the time a card renders. Vite can only bundle assets it sees referenced in
 * source, so a path that exists only as a runtime string — which is what
 * `perks.icon` is on the backend — could not be turned into a URL any other
 * way.
 */
const RUNE_ICONS = import.meta.glob("../../assets/icons/runes/*.png", {
	eager: true,
	query: "?url",
	import: "default",
}) as Record<string, string>;

/** Keyed by filename, since the glob's keys are paths relative to this module. */
const RUNE_ICON_BY_FILE = new Map(
	Object.entries(RUNE_ICONS).map(([path, url]) => [
		path.slice(path.lastIndexOf("/") + 1),
		url,
	]),
);

/**
 * "DarkHarvest" -> "dark-harvest", which is how the files are named.
 *
 * The same derivation runs in the backend's `perk-icon.utils.ts`, which writes
 * these paths into `perks.icon`. The duplication is deliberate for now: the two
 * have to agree on filenames, and there is no shared package to put it in.
 */
const kebabCase = (key: string) =>
	key
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[^A-Za-z0-9]+/g, "-")
		.toLowerCase()
		.replace(/^-|-$/g, "");

/**
 * The committed icon for a rune or a rune tree, by its Data Dragon key.
 *
 * Undefined when the art was never downloaded — a rune added to the asset
 * without re-running the download. Callers skip the image rather than render a
 * broken one, which is why this does not fall back to the CDN: a silent
 * hotlink would hide the fact that a file is missing.
 */
export const runeIconUrl = (key: string) =>
	RUNE_ICON_BY_FILE.get(`${kebabCase(key)}.png`);
