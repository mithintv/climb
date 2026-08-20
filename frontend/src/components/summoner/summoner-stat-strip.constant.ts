/**
 * The two sublines in the stat strip that no endpoint can answer yet.
 *
 * The design puts a peer comparison under CS/min ("TOP 22% PLAT") and under
 * gold/min ("+9% VS LANE"). Both need figures we do not have: the first needs
 * the distribution of CS/min across a tier, the second needs the lane
 * opponent's gold rate aggregated over the same games. Neither is derivable
 * from a match payload alone.
 *
 * They are kept, rather than dropped, so the strip has the shape the design
 * specifies and the gap is visible in one place instead of being designed
 * around. Delete this file the moment the comparisons are real — a hardcoded
 * "TOP 22%" that survives into production is a lie about a player's rank.
 */
export const SUMMONER_STAT_STRIP_PLACEHOLDER_SUBS = {
	/** Where this CS/min sits in the distribution for the player's tier. */
	csPerMinute: "TOP 22% PLAT",
	/** This gold rate against the lane opponent's, over the same games. */
	goldPerMinute: "+9% VS LANE",
} as const;
