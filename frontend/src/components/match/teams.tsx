import { Participant } from "./participant";
import type { MatchState } from "../../types/riot";

interface TeamsProps {
	match: MatchState;
}

export const Teams = (props: TeamsProps) => {
	return (
		<>
			<div className="my-1 flex flex-row justify-center">
				<div className="flex flex-col">
					{props.match.data &&
						props.match.team100.map((player) => {
							return <Participant key={player.summonerId} player={player} />;
						})}
				</div>
				<div className="w-7">
					<img
						key={0}
						className="m-auto w-4/12 pt-1"
						alt="lane position"
						src="https://cdn.mobalytics.gg/assets/common/icons/lol-roles/16-top-faded.svg"
					/>
					<img
						key={1}
						className="m-auto w-5/12 pt-1"
						alt="lane position"
						src="https://cdn.mobalytics.gg/assets/common/icons/lol-roles/16-jg-faded.svg"
					/>
					<img
						key={2}
						className="m-auto w-4/12 pt-1.5"
						alt="lane position"
						src="https://cdn.mobalytics.gg/assets/common/icons/lol-roles/16-mid-faded.svg"
					/>
					<img
						key={3}
						className="m-auto w-5/12 pt-1.5"
						alt="lane position"
						src="https://cdn.mobalytics.gg/assets/common/icons/lol-roles/16-bot-faded.svg"
					/>
					<img
						key={4}
						className="m-auto w-6/12 pt-1.5"
						alt="lane position"
						src="https://cdn.mobalytics.gg/assets/common/icons/lol-roles/16-sup-faded.svg"
					/>
				</div>
				<div className="flex flex-col">
					{props.match.data &&
						props.match.team200.map((player) => {
							return <Participant key={player.summonerId} player={player} />;
						})}
				</div>
			</div>
		</>
	);
};
