import { cn } from "@/lib/utils";
import type { IMatchParticipant } from "@/types/riot/i-match-participant.type";

import { MatchChampion } from "./match-champion";

interface IMatchParticipantProps {
	player: IMatchParticipant;
	/** Highlights the searched player's row in the roster. */
	isSearchedPlayer: boolean;
	/** Mirrors the layout so the two teams face each other across the lane icons. */
	align: "left" | "right";
}

/**
 * One name in the roster: a 16px portrait and who played it.
 *
 * The blue side reverses so the two teams read outward from the lane column in
 * the middle — the portrait always sits against its own side's edge, which is
 * what makes the two columns scan as opposing teams rather than as one list
 * split down the middle.
 */
export const MatchParticipant = (props: IMatchParticipantProps) => {
	// Riot returns "" for summonerName on every participant now; riotIdGameName
	// is the live name, and the previous card rendered ten blank rows without it.
	const name = props.player.riotIdGameName || props.player.championName;

	return (
		<div
			className={cn(
				"flex min-w-0 items-center gap-1.5",
				props.align === "right" && "flex-row-reverse",
			)}
		>
			<MatchChampion
				name={props.player.championName}
				className="size-4 shrink-0 border border-control"
			/>
			<span
				className={cn(
					"min-w-0 flex-1 truncate text-[10.5px] leading-none",
					props.align === "right" && "text-right",
					props.isSearchedPlayer
						? "font-semibold text-ink"
						: "text-ink-tertiary",
				)}
				title={name}
			>
				{name}
			</span>
		</div>
	);
};
