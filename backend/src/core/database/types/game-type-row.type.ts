import type { gameTypes } from "./../models/game-types.model.ts";

/** A row of `game_types`, inferred from the model rather than restated. */
export type GameTypeRow = typeof gameTypes.$inferSelect;
