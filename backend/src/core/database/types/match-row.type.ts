import type { matches } from "./../models/matches.model.ts";

/** A row of `matches`, inferred from the model rather than restated. */
export type MatchRow = typeof matches.$inferSelect;
