import type { perks } from "./../models/perks.model.ts";

/** A row of `perks`, inferred from the model rather than restated. */
export type PerkRow = typeof perks.$inferSelect;
