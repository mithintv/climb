import type { MatchParticipant } from "../../types/riot";
import { Champion } from "./champion";

interface ParticipantProps {
	player: MatchParticipant;
}

export const Participant = (props: ParticipantProps) => {
	return (
		<div className="flex flex-row">
			{props.player.teamId === 200 && (
				<div className="w-4">
					<Champion name={props.player.championName} />
				</div>
			)}
			<div className="mx-2 w-20 truncate">{props.player.summonerName}</div>
			{props.player.teamId === 100 && (
				<div className="w-4">
					<Champion name={props.player.championName} />
				</div>
			)}
		</div>
	);
};
