import { TrophyIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { IMatchParticipant } from "@/types/riot/i-match-participant.type";

import { formatGold } from "../match.utils";
import { matchTeamTotals } from "./match-scoreboard.utils";
import { MatchScoreboardPlayer } from "./match-scoreboard-player";

interface IMatchScoreboardTeamProps {
	/** Which side this is, as the header names it: "BLUE" or "RED". */
	side: string;
	players: IMatchParticipant[];
	/** Colours the header and picks its glyph. */
	won: boolean;
	searchedPuuid: string;
	/** Seconds, passed down for the per-minute rates on each row. */
	gameDuration: number;
}

/**
 * One side of the expanded scoreboard: a header stating the result and the
 * team's combined line, then a row per player.
 *
 * The result is in the header rather than on each row because it is a property
 * of the side, not of the player — and stating it once leaves the rows free to
 * be nothing but figures.
 */
export const MatchScoreboardTeam = (props: IMatchScoreboardTeamProps) => {
	const totals = matchTeamTotals(props.players);
	const ResultIcon = props.won ? TrophyIcon : XIcon;

	return (
		<div>
			<div
				className={cn(
					"flex items-center justify-between border-edge border-b pb-[9px] font-mono text-[9.5px] tracking-[.16em]",
					props.won ? "text-victory" : "text-defeat",
				)}
			>
				<span className="flex items-center gap-1.5">
					<ResultIcon className="size-3.5" aria-hidden={true} />
					{props.won ? "VICTORY" : "DEFEAT"} · {props.side}
				</span>
				<span className="flex gap-[22px] whitespace-nowrap text-ink-muted">
					<span>
						{totals.kills} / {totals.deaths} / {totals.assists}
					</span>
					<span>{formatGold(totals.gold)}</span>
				</span>
			</div>

			<ul>
				{props.players.map((player) => (
					<MatchScoreboardPlayer
						key={player.puuid}
						player={player}
						isSearchedPlayer={player.puuid === props.searchedPuuid}
						gameDuration={props.gameDuration}
					/>
				))}
			</ul>
		</div>
	);
};
