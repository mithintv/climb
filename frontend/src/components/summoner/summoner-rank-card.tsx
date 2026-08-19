import { TrophyIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ILeagueEntry } from "@/types/riot/i-league-entry.type";

import { formatRank, winRate } from "./summoner.utils";
import { SUMMONER_RANK_EMBLEMS } from "./summoner-rank-emblem.constant";

/** Tier colours, roughly the ones the client uses on the ranked banner. */
const TIER_COLOR: Record<string, string> = {
	IRON: "text-zinc-400",
	BRONZE: "text-amber-700",
	SILVER: "text-slate-300",
	GOLD: "text-yellow-400",
	PLATINUM: "text-teal-300",
	EMERALD: "text-emerald-400",
	DIAMOND: "text-cyan-300",
	MASTER: "text-fuchsia-400",
	GRANDMASTER: "text-rose-400",
	CHALLENGER: "text-amber-300",
};

interface ISummonerRankCardProps {
	/** Queue name as the card titles it, e.g. "Ranked Solo". */
	queueLabel: string;
	/** Absent when the player has not been placed in this queue. */
	entry: ILeagueEntry | undefined;
}

/**
 * One queue's standing, as its own card in the sidebar. Every ranked queue gets
 * a card whether or not it has been played, so the profile shows the same shape
 * for everyone rather than collapsing to whatever the player happens to play.
 */
export const SummonerRankCard = (props: ISummonerRankCardProps) => {
	const { entry } = props;
	const rate = entry ? winRate(entry.wins, entry.losses) : null;

	return (
		<section className="rounded-xl border border-gold/25 bg-card/40 card-raised">
			<h2 className="flex items-center justify-between gap-2 border-gold/15 border-b px-3 py-2.5">
				{/* The glyph names the section rather than just marking it — decorative
				    to a screen reader, which already has the heading text. */}
				<span className="flex items-center gap-2 font-semibold text-foreground text-sm">
					<TrophyIcon className="size-3.5 text-gold" aria-hidden="true" />
					{props.queueLabel}
				</span>
			</h2>

			{/* The body renders either way, so a placed queue and an empty one are the
			    same height and the rail does not reflow between players. */}
			<div className="flex items-center justify-between gap-3 px-3 py-3">
				<img
					src={
						entry
							? (SUMMONER_RANK_EMBLEMS[entry.tier] ??
								SUMMONER_RANK_EMBLEMS.UNRANKED)
							: SUMMONER_RANK_EMBLEMS.UNRANKED
					}
					alt=""
					className="size-12 shrink-0"
				/>

				{entry ? (
					<>
						<div className="mr-auto">
							<p
								className={cn(
									"font-bold text-base leading-tight",
									TIER_COLOR[entry.tier] ?? "text-foreground",
								)}
							>
								{formatRank(entry)}
							</p>
							<p className="text-[11px] text-muted-foreground tabular-nums">
								{entry.leaguePoints} LP
							</p>
						</div>

						<div className="text-right">
							<p className="text-[11px] text-muted-foreground tabular-nums">
								{entry.wins}W {entry.losses}L
							</p>
							<p className="font-semibold text-[11px] text-foreground tabular-nums">
								{rate === null ? "—" : `${rate}% Win Rate`}
							</p>
						</div>
					</>
				) : (
					<p className="mr-auto font-medium text-muted-foreground text-sm">
						Unranked
					</p>
				)}
			</div>
		</section>
	);
};
