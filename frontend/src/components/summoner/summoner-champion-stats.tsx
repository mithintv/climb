import { SwordsIcon } from "lucide-react";

import { MatchChampion } from "@/components/matches/match-champion";
import { cn } from "@/lib/utils";
import type { IMatch } from "@/types/riot/i-match.type";

import { championStats, winRate } from "./summoner.utils";

interface ISummonerChampionStatsProps {
	matches: IMatch[];
	puuid: string;
	/** How many champions to list before stopping. */
	limit?: number;
}

export const SummonerChampionStats = (props: ISummonerChampionStatsProps) => {
	const stats = championStats(props.matches, props.puuid);
	if (stats.length === 0) return null;

	const shown = stats.slice(0, props.limit ?? 5);

	return (
		<section className="rounded-xl border border-gold/25 bg-card/40 card-raised">
			<h2 className="flex items-center justify-between gap-2 border-gold/15 border-b px-3 py-2.5">
				<span className="flex items-center gap-2 font-semibold text-foreground text-sm">
					<SwordsIcon className="size-3.5 text-gold" aria-hidden="true" />
					Champion Stats
				</span>
				{/* Named for the sample it covers: these are the loaded matches, not a
				    season record, and saying so avoids implying otherwise. */}
				<span className="text-[11px] text-muted-foreground">
					Last {props.matches.length} games
				</span>
			</h2>

			<ul className="flex flex-col">
				{shown.map((stat) => {
					const rate = winRate(stat.wins, stat.games - stat.wins);
					// Deaths can legitimately be zero across the sample.
					const kda =
						stat.deaths === 0
							? null
							: (stat.kills + stat.assists) / stat.deaths;

					return (
						<li
							key={stat.championName}
							className="flex items-center gap-2.5 border-white/5 border-b px-3 py-2 last:border-b-0"
						>
							<MatchChampion
								name={stat.championName}
								className="size-8 shrink-0 rounded-md border border-white/10"
							/>
							{/* The name takes whatever the two figure columns do not, since it
							    is the only cell whose width is not known ahead of time —
							    "Aurelion Sol" needs the room a fixed column would deny it. */}
							<span className="min-w-0 flex-1 truncate font-medium text-foreground text-sm">
								{stat.championName}
							</span>

							<span className="shrink-0 text-right text-muted-foreground text-xs tabular-nums">
								{kda === null ? "Perfect" : kda.toFixed(2)}
								<span className="ml-1 text-[10px]">KDA</span>
							</span>

							{/* Win rate over game count in one column: two short figures
							    stacked cost the width of the longer one instead of both. */}
							<span className="shrink-0 text-right leading-tight">
								<span
									className={cn(
										"block font-semibold text-xs tabular-nums",
										rate !== null && rate >= 60 && "text-orange-300",
										rate !== null && rate <= 40 && "text-rose-300",
									)}
								>
									{rate}%
								</span>
								<span className="block text-[10px] text-muted-foreground tabular-nums">
									{stat.games} {stat.games === 1 ? "game" : "games"}
								</span>
							</span>
						</li>
					);
				})}
			</ul>
		</section>
	);
};
