import type { gameMaps } from "./../models/game-maps.model.ts";

/** A row of `game_maps`, inferred from the model rather than restated. */
export type GameMapRow = typeof gameMaps.$inferSelect;
