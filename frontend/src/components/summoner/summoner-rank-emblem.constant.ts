// The client's own ranked emblems, from CommunityDragon's
// `rcp-fe-lol-shared-components` bundle rather than the `ranked-emblem` set in
// `rcp-fe-lol-static-assets`: that one is the same art laid out as 1280x720
// wallpaper, with the emblem occupying about a fifth of a transparent canvas.
// These are cropped square at 500x500, so they need no framing to sit in a card.

/**
 * Emblem per Riot tier name, read off the glob's module paths
 * (`.../ranked-emblems/platinum.png` → `PLATINUM`). Keyed uppercase because that
 * is how league-v4 states `tier`; `UNRANKED` is Riot's own file, used when a
 * queue has no entry at all.
 */
export const SUMMONER_RANK_EMBLEMS: Record<string, string> = Object.fromEntries(
	Object.entries(
		import.meta.glob("../../assets/icons/ranked-emblems/*.png", {
			eager: true,
			import: "default",
			query: "?url",
		}),
	).map(([path, url]) => [
		path.slice(path.lastIndexOf("/") + 1, -".png".length).toUpperCase(),
		url as string,
	]),
);
