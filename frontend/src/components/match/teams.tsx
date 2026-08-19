import type { MatchState } from "../../types/riot";
import { LANE_ICONS } from "./lane-icon.constant";
import { Participant } from "./participant";

interface TeamsProps {
	match: MatchState;
}

export const Teams = (props: TeamsProps) => {
	if (!props.match.data) return null;

	const searchedPuuid = props.match.player.puuid;

	return (
		<div className="flex flex-row items-center gap-1.5">
			<div className="flex flex-col">
				{props.match.team100.map((player) => (
					<Participant
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
				{LANE_ICONS.map((lane) => (
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
			<div className="flex flex-col">
				{props.match.team200.map((player) => (
					<Participant
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
