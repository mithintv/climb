import type { accounts } from "./../models/accounts.model.ts";

/**
 * The columns required to insert an account. Differs from `AccountRow` in the
 * columns the database fills in itself: `id` is optional here.
 */
export type AccountInsert = typeof accounts.$inferInsert;
