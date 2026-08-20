import type { accountMatches } from "./../models/account-matches.model.ts";

/** A row of `account_matches`, inferred from the model rather than restated. */
export type AccountMatchRow = typeof accountMatches.$inferSelect;
