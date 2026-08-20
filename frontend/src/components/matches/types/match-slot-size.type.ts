/**
 * The two sizes every icon slot on a match card comes in: the collapsed row,
 * and the ten-player scoreboard underneath it.
 *
 * A named pair rather than a pixel number, because the sizes are not
 * independent — spells, runes and items all step down together when the
 * scoreboard opens, and letting a call site pass its own number is how one of
 * them ends up a pixel off the others.
 */
export const MATCH_SLOT_SIZES = ["card", "scoreboard"] as const;

/** Which of the two size steps a slot is drawn at. */
export type MatchSlotSize = (typeof MATCH_SLOT_SIZES)[number];
