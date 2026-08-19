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
		<section className="rounded-xl border border-white/5 bg-card/40">
			<h2 className="flex items-center justify-between gap-2 border-white/5 border-b px-3 py-2.5">
				<span className="flex items-center gap-2 font-semibold text-foreground text-sm">
					<SwordsIcon className="size-3.5 text-cyan-400" aria-hidden="true" />
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
							className="flex items-center gap-3 border-white/5 border-b px-3 py-2 last:border-b-0"
						>
							<MatchChampion
								name={stat.championName}
								className="size-8 shrink-0 rounded-md border border-white/10"
							/>
							<span className="min-w-0 flex-1 truncate font-medium text-foreground text-sm">
								{stat.championName}
							</span>

							<span className="text-muted-foreground text-xs tabular-nums">
								{stat.games} {stat.games === 1 ? "game" : "games"}
							</span>
							<span
								className={cn(
									"w-10 text-right font-semibold text-xs tabular-nums",
									rate !== null && rate >= 60 && "text-cyan-300",
									rate !== null && rate <= 40 && "text-rose-300",
								)}
							>
								{rate}%
							</span>
							<span className="w-16 text-right text-muted-foreground text-xs tabular-nums">
								{kda === null ? "Perfect" : `${kda.toFixed(2)} KDA`}
							</span>
						</li>
					);
				})}
			</ul>
		</section>
	);
};
