// The client's own rail icons, sliced out of its texture atlas
// (`game/assets/ux/itemshop/itemshop_texture_atlas4.png` on CommunityDragon).
// Data Dragon serves no stat art at all — every `/img/ui/*` path 403s — and the
// atlas is packed without a manifest, so the glyphs are committed as files
// rather than hotlinked and re-sliced on every patch.
//
// The atlas carries five colour variants per stat. Two are used: the neutral
// grey the rail sits in, and the coloured one that marks a filter as on. Both
// sets share a filename per stat, so they are read off disk by name instead of
// through 28 hand-written imports.
const byStat = (modules: Record<string, unknown>): Record<string, string> =>
	Object.fromEntries(
		Object.entries(modules).map(([path, url]) => [
			path.slice(path.lastIndexOf("/") + 1, -".png".length),
			url as string,
		]),
	);

/** Icon per stat key, coloured — the state a selected filter is drawn in. */
export const COLOR_ICONS = byStat(
	import.meta.glob("../../../assets/item-tags/color/*.png", {
		eager: true,
		import: "default",
		query: "?url",
	}),
);

/** Icon per stat key, grey — the rail's resting state. */
export const MONO_ICONS = byStat(
	import.meta.glob("../../../assets/item-tags/mono/*.png", {
		eager: true,
		import: "default",
		query: "?url",
	}),
);
