import type { IPerkStyle } from "@/types/riot/i-perk-style.type";

/**
 * A tree as the bundled `runesReforged.json` states it: the tree's own id and
 * name, plus the four rows of runes that can be picked inside it.
 */
export interface IRuneTreeLibraryEntry {
	id: number;
	key: string;
	name: string;
	slots: { runes: IRune[] }[];
}

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

/** One rune, as Data Dragon's `runesReforged.json` states it. */
export interface IRune {
	id: number;
	/** Data Dragon key, e.g. "DarkHarvest"; the committed icon is named after it. */
	key: string;
	name: string;
}

/** A rune tree — the same shape, without the slots the caller does not need. */
export interface IRuneTree {
	id: number;
	key: string;
	name: string;
}

/** A participant's rune page, resolved from ids into the art and names. */
export interface IResolvedMatchRunes {
	primaryTree: IRuneTree | undefined;
	secondaryTree: IRuneTree | undefined;
	/** The four picks from the primary tree, keystone first. */
	primaryRunes: IRune[];
	/** The two picks from the secondary tree. */
	secondaryRunes: IRune[];
	/** The primary tree's first pick — the only rune a collapsed card shows. */
	keystone: IRune | undefined;
}

/** How many picks each tree contributes to a rune page. */
const PRIMARY_PICKS = 4;
const SECONDARY_PICKS = 2;

/**
 * Turns the perk ids on a participant into the runes they name.
 *
 * A rune's id is not scoped to the slot row it sits in, so a pick is found by
 * scanning every row of its tree rather than by indexing — Riot's payload gives
 * the order picks were made, not where they live in the tree.
 *
 * Every field can come back undefined or short. Arena and some rotating modes
 * return a `perks` block with no selections at all, and the caller has to be
 * able to render a card without a rune page rather than throw on one.
 */
export const resolveMatchRunes = (
	styles: IPerkStyle[],
	primaryId: number,
	secondaryId: number,
	library: IRuneTreeLibraryEntry[],
): IResolvedMatchRunes => {
	const treeById = (id: number) => library.find((tree) => tree.id === id);

	const picksFrom = (styleIndex: number, treeId: number, count: number) => {
		const tree = treeById(treeId);
		const selections = styles[styleIndex]?.selections ?? [];
		if (!tree) return [];

		const picks: IRune[] = [];
		for (let pick = 0; pick < count; pick += 1) {
			const perkId = selections[pick]?.perk;
			if (perkId === undefined) continue;
			for (const slot of tree.slots) {
				const rune = slot.runes.find((candidate) => candidate.id === perkId);
				if (rune) {
					picks.push(rune);
					break;
				}
			}
		}
		return picks;
	};

	const primaryRunes = picksFrom(0, primaryId, PRIMARY_PICKS);

	return {
		primaryTree: treeById(primaryId),
		secondaryTree: treeById(secondaryId),
		primaryRunes,
		secondaryRunes: picksFrom(1, secondaryId, SECONDARY_PICKS),
		keystone: primaryRunes[0],
	};
};
