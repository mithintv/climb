import { MatchChampion } from "@/components/matches/match-champion";
import { cn } from "@/lib/utils";
import type { IMatch } from "@/types/riot/i-match.type";

import { championStats, recentRecord, winRate } from "./summoner.utils";

interface ISummonerRecentSummaryProps {
	matches: IMatch[];
	puuid: string;
}

/**
 * The strip above the match list: the record over the loaded games, the average
 * KDA behind it, and the champions those games were played on. It summarises
 * the same sample the list below shows, so it is labelled by game count rather
 * than presented as a season figure.
 */
export const SummonerRecentSummary = (props: ISummonerRecentSummaryProps) => {
	const record = recentRecord(props.matches, props.puuid);
	if (record.games === 0) return null;

	const rate = winRate(record.wins, record.losses);
	// Deaths can legitimately average zero across a short sample.
	const kda =
		record.deaths === 0
			? null
			: (record.kills + record.assists) / record.deaths;
	const champions = championStats(props.matches, props.puuid).slice(0, 3);

	return (
		<div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-white/5 bg-card/40 px-4 py-3">
			<div>
				<p
					className={cn(
						"font-bold text-sm tabular-nums",
						rate !== null && rate >= 60 && "text-cyan-300",
						rate !== null && rate <= 40 && "text-rose-300",
					)}
				>
					{rate}% WR
				</p>
				<p className="text-[10px] text-muted-foreground tabular-nums">
					Last {record.games} {record.games === 1 ? "game" : "games"} ·{" "}
					{record.wins}W {record.losses}L
				</p>
			</div>

			<div>
				<p className="font-bold text-foreground text-sm tabular-nums">
					{kda === null ? "Perfect" : `${kda.toFixed(2)} KDA`}
				</p>
				<p className="text-[10px] text-muted-foreground tabular-nums">
					{record.kills.toFixed(1)} / {record.deaths.toFixed(1)} /{" "}
					{record.assists.toFixed(1)}
				</p>
			</div>

			<ul className="flex flex-wrap items-center gap-4">
				{champions.map((champion) => {
					const championRate = winRate(
						champion.wins,
						champion.games - champion.wins,
					);
					const championKda =
						champion.deaths === 0
							? null
							: (champion.kills + champion.assists) / champion.deaths;

					return (
						<li key={champion.championName} className="flex items-center gap-2">
							<MatchChampion
								name={champion.championName}
								className="size-7 shrink-0 rounded-full border border-white/10"
							/>
							<div>
								<p
									className={cn(
										"font-semibold text-[11px] tabular-nums",
										championRate !== null &&
											championRate >= 60 &&
											"text-cyan-300",
										championRate !== null &&
											championRate <= 40 &&
											"text-rose-300",
									)}
								>
									{championRate}% ({champion.wins}W{" "}
									{champion.games - champion.wins}L)
								</p>
								<p className="text-[10px] text-muted-foreground tabular-nums">
									{championKda === null
										? "Perfect"
										: `${championKda.toFixed(2)} KDA`}
								</p>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
};
