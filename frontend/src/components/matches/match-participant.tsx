import { cn } from "@/lib/utils";

import type { IMatchParticipant } from "../../types/riot/i-match-participant.type";
import { MatchChampion } from "./match-champion";

interface MatchParticipantProps {
	player: IMatchParticipant;
	/** Highlights the searched player's row in the team lists. */
	isSearchedPlayer: boolean;
	/** Mirrors the layout so the two teams face each other across the role icons. */
	align: "left" | "right";
}

export const MatchParticipant = (props: MatchParticipantProps) => {
	// Riot returns "" for summonerName on every participant now; riotIdGameName
	// is the live name, and the previous card rendered ten blank rows without it.
	const name = props.player.riotIdGameName || props.player.championName;

	return (
		// h-4.5 matches the role icon rows, so the three columns stay aligned.
		<div
			className={cn(
				"flex h-4.5 min-w-0 items-center gap-1.5",
				props.align === "right" && "flex-row-reverse",
			)}
		>
			<MatchChampion
				name={props.player.championName}
				className="size-4 shrink-0 rounded-sm"
			/>
			<span
				className={cn(
					// Grows to the 72px it had before, but gives that width back when the
					// row is short of space, so the name truncates instead of the list
					// being cut off at the card's edge.
					"min-w-0 max-w-18 flex-1 truncate text-[10px] leading-none",
					props.align === "right" && "text-right",
					props.isSearchedPlayer
						? "font-semibold text-foreground"
						: "text-muted-foreground",
				)}
				title={name}
			>
				{name}
			</span>
		</div>
	);
};
