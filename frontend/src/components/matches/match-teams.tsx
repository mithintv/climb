import type { MatchState } from "../../types/riot/match-state.type";
import { MATCH_LANE_ICONS } from "./constants/match-lane-icon.constant";
import { MatchParticipant } from "./match-participant";

interface MatchTeamsProps {
	match: MatchState;
}

export const MatchTeams = (props: MatchTeamsProps) => {
	if (!props.match.data) return null;

	const searchedPuuid = props.match.player.puuid;

	return (
		<div className="flex min-w-0 flex-row items-center gap-1.5">
			<div className="flex min-w-0 flex-1 flex-col">
				{props.match.team100.map((player) => (
					<MatchParticipant
						key={player.puuid}
						player={player}
						align="right"
						isSearchedPlayer={player.puuid === searchedPuuid}
					/>
				))}
			</div>
			{/* One icon per row, marking the role the two facing participants played.
			    Decorative: the row it labels already names both players. */}
			<div className="flex flex-col">
				{MATCH_LANE_ICONS.map((lane) => (
					<div key={lane.position} className="flex h-4.5 items-center">
						<img
							className="size-3 opacity-60"
							src={lane.url}
							alt=""
							title={lane.position}
							loading="lazy"
						/>
					</div>
				))}
			</div>
			<div className="flex min-w-0 flex-1 flex-col">
				{props.match.team200.map((player) => (
					<MatchParticipant
						key={player.puuid}
						player={player}
						align="left"
						isSearchedPlayer={player.puuid === searchedPuuid}
					/>
				))}
			</div>
		</div>
	);
};
