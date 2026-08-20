import type { patches } from "./../models/patches.model.ts";

/** A row of `patches`, inferred from the model rather than restated. */
export type PatchRow = typeof patches.$inferSelect;
