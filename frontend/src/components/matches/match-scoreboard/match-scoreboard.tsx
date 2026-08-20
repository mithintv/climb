import type { IMatchParticipant } from "@/types/riot/i-match-participant.type";

import { MatchScoreboardTeam } from "./match-scoreboard-team";

interface IMatchScoreboardProps {
	/** Blue side, sorted by position. */
	team100: IMatchParticipant[];
	/** Red side, sorted by position. */
	team200: IMatchParticipant[];
	searchedPuuid: string;
	/** Seconds, for the per-minute rates. Riot reports it on the match, not the player. */
	gameDuration: number;
}

/**
 * The full ten-player scoreboard a match card opens into.
 *
 * Side by side rather than stacked: the question this panel answers is almost
 * always comparative — who out-farmed whom, where the gold went — and two
 * columns put a player next to their opposite number instead of five rows away
 * from them.
 */
export const MatchScoreboard = (props: IMatchScoreboardProps) => {
	// Riot marks the result per participant, so either side's first player
	// carries it. An empty side cannot happen in a match the player is in.
	const blueWon = props.team100[0]?.win ?? false;

	return (
		// Inset from the row above it. The collapsed card runs the full width of
		// the list because its columns are what the list is read down; the
		// scoreboard is a panel hanging off one card, and stepping it in is what
		// says so.
		<div className="grid grid-cols-1 gap-11 px-4 pt-0.5 pb-[26px] lg:grid-cols-2">
			<MatchScoreboardTeam
				side="BLUE"
				players={props.team100}
				won={blueWon}
				searchedPuuid={props.searchedPuuid}
				gameDuration={props.gameDuration}
			/>
			<MatchScoreboardTeam
				side="RED"
				players={props.team200}
				won={!blueWon}
				searchedPuuid={props.searchedPuuid}
				gameDuration={props.gameDuration}
			/>
		</div>
	);
};
