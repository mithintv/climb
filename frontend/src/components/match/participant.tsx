import { cn } from "@/lib/utils";

import type { MatchParticipant } from "../../types/riot";
import { Champion } from "./champion";

interface ParticipantProps {
	player: MatchParticipant;
	/** Highlights the searched player's row in the team lists. */
	isSearchedPlayer: boolean;
	/** Mirrors the layout so the two teams face each other across the role icons. */
	align: "left" | "right";
}

export const Participant = (props: ParticipantProps) => {
	// Riot returns "" for summonerName on every participant now; riotIdGameName
	// is the live name, and the previous card rendered ten blank rows without it.
	const name = props.player.riotIdGameName || props.player.championName;

	return (
		// h-4.5 matches the role icon rows, so the three columns stay aligned.
		<div
			className={cn(
				"flex h-4.5 items-center gap-1.5",
				props.align === "right" && "flex-row-reverse",
			)}
		>
			<Champion
				name={props.player.championName}
				className="size-4 shrink-0 rounded-sm"
			/>
			<span
				className={cn(
					"w-18 truncate text-[10px] leading-none",
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
