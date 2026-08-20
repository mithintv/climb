import { cn } from "@/lib/utils";
import type { ILeagueEntry } from "@/types/riot/i-league-entry.type";

import {
	entryForQueue,
	formatRank,
	SOLO_QUEUE,
	winRate,
} from "./summoner.utils";
import { SummonerLpHistory } from "./summoner-lp-history";
import { SUMMONER_LP_HISTORY_PLACEHOLDER } from "./summoner-lp-history.constant";
import { SUMMONER_RANK_EMBLEMS } from "./summoner-rank-emblem.constant";

/** Ranked games needed before a queue reports a rank. */
const PLACEMENT_GAMES = 5;

/** The queue this panel reports, as the LP chart's caption states it. */
const RANK_QUEUE_LABEL = "RANKED SOLO";

interface ISummonerRankPanelProps {
	ranks: ILeagueEntry[];
}

/**
 * Standing in ranked solo/duo, which is the only queue the profile reports.
 *
 * Nothing names the queue in the block itself — the rail has one rank on it and
 * the LP chart below states which queue it is, so a heading over the emblem was
 * a second answer to a question only asked once.
 */
export const SummonerRankPanel = (props: ISummonerRankPanelProps) => {
	const entry = entryForQueue(props.ranks, SOLO_QUEUE);
	const rate = entry ? winRate(entry.wins, entry.losses) : null;

	// Placeholder: no LP series is stored for any queue, so only a queue the
	// player is actually placed in gets the stand-in chart — an unranked queue
	// showing a climb would be nonsense rather than a gap. See the constant.
	const lp = entry ? SUMMONER_LP_HISTORY_PLACEHOLDER : [];

	return (
		<div className="border-edge border-b py-5">
			<div className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-4">
				<img
					src={
						SUMMONER_RANK_EMBLEMS[entry?.tier ?? "UNRANKED"] ??
						SUMMONER_RANK_EMBLEMS.UNRANKED
					}
					alt=""
					className="size-18.5 shrink-0"
				/>

				<div className="min-w-0">
					<div className="flex items-baseline gap-2.5">
						<div
							className={cn(
								"truncate font-semibold text-[22px] tracking-[-.02em]",
								entry ? "text-ink" : "text-ink-label",
							)}
						>
							{entry ? formatRank(entry) : "Unranked"}
						</div>
						{entry && (
							<div className="shrink-0 font-mono text-[14px] text-ink">
								{entry.leaguePoints} LP
							</div>
						)}
					</div>

					{/* Clamped, because master and above accumulate LP past 100 and a
					    1,200 LP challenger would otherwise draw a bar twelve times the
					    width of its track. */}
					<div className="mt-3 h-1 overflow-hidden rounded-[2px] bg-track">
						<div
							className="h-full bg-ink"
							style={{
								width: `${Math.min(100, entry?.leaguePoints ?? 0)}%`,
							}}
						/>
					</div>

					<div className="mt-2 font-mono text-[10px] text-ink-label leading-[1.5] tracking-[.08em]">
						{entry
							? `${entry.wins}W ${entry.losses}L · ${rate}% WR`
							: `0 GAMES · ${PLACEMENT_GAMES} PLACEMENTS NEEDED`}
					</div>
				</div>
			</div>

			<SummonerLpHistory queueLabel={RANK_QUEUE_LABEL} lp={lp} />
		</div>
	);
};
