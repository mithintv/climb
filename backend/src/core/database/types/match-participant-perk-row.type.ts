import type { matchParticipantPerks } from "./../models/match-participant-perks.model.ts";

/** A row of `match_participant_perks`, inferred from the model rather than restated. */
export type MatchParticipantPerkRow = typeof matchParticipantPerks.$inferSelect;
