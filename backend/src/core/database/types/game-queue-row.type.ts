import type { gameQueues } from "./../models/game-queues.model.ts";

/** A row of `game_queues`, inferred from the model rather than restated. */
export type GameQueueRow = typeof gameQueues.$inferSelect;
