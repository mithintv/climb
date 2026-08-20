import type { matchParticipants } from "./../models/match-participants.model.ts";

/** A row of `match_participants`, inferred from the model rather than restated. */
export type MatchParticipantRow = typeof matchParticipants.$inferSelect;
