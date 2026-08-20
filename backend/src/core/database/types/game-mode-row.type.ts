import type { gameModes } from "./../models/game-modes.model.ts";

/** A row of `game_modes`, inferred from the model rather than restated. */
export type GameModeRow = typeof gameModes.$inferSelect;
