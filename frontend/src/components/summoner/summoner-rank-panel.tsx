import { useState } from "react";

import { cn } from "@/lib/utils";
import type { ILeagueEntry } from "@/types/riot/i-league-entry.type";

import {
	entryForQueue,
	FLEX_QUEUE,
	formatRank,
	SOLO_QUEUE,
	winRate,
} from "./summoner.utils";
import { SummonerLpHistory } from "./summoner-lp-history";
import { SUMMONER_LP_HISTORY_PLACEHOLDER } from "./summoner-lp-history.constant";
import { SUMMONER_RANK_EMBLEMS } from "./summoner-rank-emblem.constant";

/** Ranked games needed before a queue reports a rank. */
const PLACEMENT_GAMES = 5;

/** The two ranked queues, in the order the toggle offers them. */
const RANK_QUEUES = [
	{ queueType: SOLO_QUEUE, label: "RANKED SOLO" },
	{ queueType: FLEX_QUEUE, label: "RANKED FLEX" },
] as const;

interface ISummonerRankPanelProps {
	ranks: ILeagueEntry[];
}

/**
 * Standing in one ranked queue at a time, with a toggle rather than a card
 * each.
 *
 * Two stacked cards gave a flex queue nobody plays the same weight as the solo
 * rank the profile is about, and cost the rail 200px before the champion pool
 * started. A toggle says the same thing in one block: the queue you are looking
 * at is the one that is lit.
 */
export const SummonerRankPanel = (props: ISummonerRankPanelProps) => {
	const [queueType, setQueueType] = useState<string>(SOLO_QUEUE);
	const entry = entryForQueue(props.ranks, queueType);
	const rate = entry ? winRate(entry.wins, entry.losses) : null;
	const queueLabel =
		RANK_QUEUES.find((queue) => queue.queueType === queueType)?.label ?? "";

	// Placeholder: no LP series is stored for any queue, so only a queue the
	// player is actually placed in gets the stand-in chart — an unranked queue
	// showing a climb would be nonsense rather than a gap. See the constant.
	const lp = entry ? SUMMONER_LP_HISTORY_PLACEHOLDER : [];

	return (
		<div className="border-edge border-b py-5">
			<div className="flex gap-0.5">
				{RANK_QUEUES.map((queue) => {
					const active = queue.queueType === queueType;
					return (
						<button
							key={queue.queueType}
							type="button"
							onClick={() => setQueueType(queue.queueType)}
							aria-pressed={active}
							className={cn(
								"flex-1 border px-2 py-1.5 text-center font-mono text-[9px] tracking-[.12em] transition-colors",
								active
									? "border-ink bg-ink text-surface"
									: "border-control text-ink-tertiary hover:text-ink",
							)}
						>
							{queue.label}
						</button>
					);
				})}
			</div>

			<div className="mt-[18px] grid grid-cols-[74px_minmax(0,1fr)] items-center gap-4">
				<img
					src={
						SUMMONER_RANK_EMBLEMS[entry?.tier ?? "UNRANKED"] ??
						SUMMONER_RANK_EMBLEMS.UNRANKED
					}
					alt=""
					className="size-[74px] shrink-0"
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

			<SummonerLpHistory queueLabel={queueLabel} lp={lp} />
		</div>
	);
};
