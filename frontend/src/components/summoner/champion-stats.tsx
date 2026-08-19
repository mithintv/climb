import { Champion } from "@/components/match/champion";
import { cn } from "@/lib/utils";
import type { MatchDto } from "@/types/riot";

import { championStats, winRate } from "./summoner.utils";

interface IChampionStatsProps {
	matches: MatchDto[];
	puuid: string;
	/** How many champions to list before stopping. */
	limit?: number;
}

export const ChampionStats = (props: IChampionStatsProps) => {
	const stats = championStats(props.matches, props.puuid);
	if (stats.length === 0) return null;

	const shown = stats.slice(0, props.limit ?? 5);

	return (
		<section>
			<h2 className="mb-3 px-1 font-medium text-muted-foreground text-xs uppercase tracking-widest">
				{/* Named for the sample it covers: these are the loaded matches, not a
				    season record, and saying so avoids implying otherwise. */}
				Champions · last {props.matches.length} games
			</h2>

			<ul className="flex flex-col gap-1">
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
							className="flex items-center gap-3 rounded-lg border border-white/5 bg-card/40 px-3 py-2"
						>
							<Champion
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
