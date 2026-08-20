import { SwordsIcon } from "lucide-react";

import { MatchChampion } from "@/components/matches/match-champion";
import { cn } from "@/lib/utils";
import type { IMatch } from "@/types/riot/i-match.type";

import { championStats, winRate } from "./summoner.utils";

/**
 * Where a win rate stops reading as good and starts reading as bad. Only the
 * ends are coloured — a champion sitting near even is stated in the same ink as
 * everything else, because tinting the middle of the range makes the colour
 * mean "this is a win rate" instead of "this is a good one".
 */
const STRONG_WIN_RATE = 60;
const WEAK_WIN_RATE = 45;

interface ISummonerChampionPoolProps {
	matches: IMatch[];
	puuid: string;
	/** How many champions to list before stopping. */
	limit?: number;
}

/**
 * What has actually been played, over the loaded games. Most played first, so
 * the list opens on the champion a reader is most likely to be asking about.
 */
export const SummonerChampionPool = (props: ISummonerChampionPoolProps) => {
	const stats = championStats(props.matches, props.puuid);
	if (stats.length === 0) return null;

	const shown = stats.slice(0, props.limit ?? 5);

	return (
		<section className="border-edge border-b py-5">
			<h2 className="flex items-center gap-2 font-mono text-[10px] text-ink-label tracking-[.2em]">
				<SwordsIcon className="size-[15px]" aria-hidden={true} />
				CHAMPION POOL
			</h2>

			<ul>
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
							className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 border-divider border-b py-3 transition-colors hover:bg-rail-hover"
						>
							<MatchChampion
								name={stat.championName}
								className="size-[34px] shrink-0 border border-control"
							/>

							<div className="min-w-0">
								<div className="truncate font-medium text-[13px] text-ink">
									{stat.championName}
								</div>
								{/* The ratio and the line it came from, in that order: the
								    ratio is the comparable figure and the K/D/A behind it is
								    what makes a 3.0 built on kills readable apart from one
								    built on assists. */}
								<div className="mt-[3px] flex items-baseline gap-2 font-mono text-[10px]">
									<span className="text-ink-secondary">
										{kda === null ? "Perfect" : `${kda.toFixed(2)} KDA`}
									</span>
									<span className="truncate text-ink-muted">
										{(stat.kills / stat.games).toFixed(1)} /{" "}
										{(stat.deaths / stat.games).toFixed(1)} /{" "}
										{(stat.assists / stat.games).toFixed(1)}
									</span>
								</div>
							</div>

							<div className="text-right">
								<div
									className={cn(
										"font-mono text-[14px]",
										rate !== null && rate >= STRONG_WIN_RATE && "text-victory",
										rate !== null &&
											rate < STRONG_WIN_RATE &&
											rate >= WEAK_WIN_RATE &&
											"text-ink",
										rate !== null &&
											rate < WEAK_WIN_RATE &&
											"text-ink-tertiary",
									)}
								>
									{rate}%
								</div>
								<div className="mt-[3px] font-mono text-[10px] text-ink-muted">
									{stat.games} {stat.games === 1 ? "GAME" : "GAMES"}
								</div>
							</div>
						</li>
					);
				})}
			</ul>
		</section>
	);
};
