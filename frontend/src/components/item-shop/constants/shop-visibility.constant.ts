// What counts as being in the Rift shop. Data Dragon marks no such thing, so
// the shop set is carved out of the asset by these three rules.

/** `maps` key for Summoner's Rift, the only map the shop is scoped to today. */
export const SUMMONERS_RIFT = "11";

/** Display name for `SUMMONERS_RIFT`, shown in the map slot of the filters. */
export const SUMMONERS_RIFT_LABEL = "Summoner's Rift";

/**
 * `maps` key for Classic Rift, required alongside `SUMMONERS_RIFT`.
 *
 * Data Dragon's `maps` flag means "enabled on this map", not "in this map's
 * shop", so map 11 alone pulls in items only reachable there through another
 * queue — the four Guardian's starters and Cappa Juice. Nothing in Data Dragon
 * or CommunityDragon marks the real shop list (CommunityDragon's items.json
 * has no `maps` at all), but those five are the only entries flagged for the
 * Rift and not for classic play, so the pair of flags separates them.
 */
export const CLASSIC_RIFT = "453";

/**
 * Alternate modes (Arena, Swarm, …) ship copies of Rift items under six-digit
 * ids that still flag `maps["11"]`, which would duplicate ~35 names in the
 * grid. The canonical shop lives in the five-digit id space below this floor.
 */
export const ALT_MODE_ID_FLOOR = 100_000;
