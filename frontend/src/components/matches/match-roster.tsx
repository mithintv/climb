import { Fragment } from "react";

import type { IMatchParticipant } from "@/types/riot/i-match-participant.type";

import { MATCH_LANE_ICONS } from "./constants/match-lane-icon.constant";
import { MatchParticipant } from "./match-participant";

interface IMatchRosterProps {
	/** Blue side, sorted by position. Rendered mirrored down the left. */
	team100: IMatchParticipant[];
	/** Red side, sorted by position. */
	team200: IMatchParticipant[];
	/** Whose row is picked out of the twenty names. */
	searchedPuuid: string;
}

/**
 * Both teams as facing name columns, with the lane each pair played between
 * them.
 *
 * One grid rather than three stacked columns: the lane icon has to line up with
 * the two players it labels, and three independent flex columns only stay in
 * step as long as every row happens to be the same height. A name that wraps or
 * a missing portrait breaks that; a grid row cannot come apart.
 */
export const MatchRoster = (props: IMatchRosterProps) => {
	// Arena and other modes are not 5v5, and a remake can be short a player, so
	// the pairing runs to the longer side and tolerates a missing opposite number.
	const rows = Math.max(props.team100.length, props.team200.length);

	return (
		<div className="grid min-w-0 grid-cols-[minmax(0,1fr)_18px_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5">
			{Array.from({ length: rows }, (_, row) => {
				const left = props.team100[row];
				const right = props.team200[row];
				const lane = MATCH_LANE_ICONS[row];
				const LaneIcon = lane?.Icon;

				return (
					// The pair is the row, so it keys on both puuids — either one alone
					// is absent in the modes where a side is short.
					<Fragment key={`${left?.puuid ?? "none"}-${right?.puuid ?? "none"}`}>
						{left ? (
							<MatchParticipant
								player={left}
								align="right"
								isSearchedPlayer={left.puuid === props.searchedPuuid}
							/>
						) : (
							<div />
						)}

						{/* Decorative: the row it labels already names both players. Only
						    present for the five summoner's rift positions — a mode with
						    more rows leaves the column blank rather than inventing lanes. */}
						{LaneIcon ? (
							// The title sits on the wrapper rather than the icon: the svg is
							// decorative and hidden, and a hidden element carries no tooltip.
							<span
								className="justify-self-center text-ink-label"
								title={lane.position}
							>
								<LaneIcon className="size-[13px]" />
							</span>
						) : (
							<div />
						)}

						{right ? (
							<MatchParticipant
								player={right}
								align="left"
								isSearchedPlayer={right.puuid === props.searchedPuuid}
							/>
						) : (
							<div />
						)}
					</Fragment>
				);
			})}
		</div>
	);
};
