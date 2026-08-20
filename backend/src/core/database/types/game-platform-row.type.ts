import type { gamePlatforms } from "./../models/game-platforms.model.ts";

/** A row of `game_platforms`, inferred from the model rather than restated. */
export type GamePlatformRow = typeof gamePlatforms.$inferSelect;
