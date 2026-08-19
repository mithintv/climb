import type { accounts } from "./../models/accounts.model.ts";

/** A row of `accounts`, inferred from the model rather than restated. */
export type AccountRow = typeof accounts.$inferSelect;
