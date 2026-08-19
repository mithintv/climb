import type { IGameInfo } from "./i-game-info.type";
import type { IMatchNotes } from "./i-match-notes.type";
import type { IMatchParticipant } from "./i-match-participant.type";

/**
 * A match payload split into the searched player's line and the two teams.
 * Discriminated on `data`, so a match the player is not in narrows `player` and
 * `game` to null rather than leaving callers to guard each one.
 */
export type MatchState =
	| {
			data: false;
			player: null;
			game: null;
			team100: IMatchParticipant[];
			team200: IMatchParticipant[];
			notes: IMatchNotes | null;
	  }
	| {
			data: true;
			player: IMatchParticipant;
			game: IGameInfo;
			team100: IMatchParticipant[];
			team200: IMatchParticipant[];
			notes: IMatchNotes | null;
	  };
