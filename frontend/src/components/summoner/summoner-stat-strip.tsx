import { PercentIcon, TargetIcon } from "lucide-react";
import type { ReactNode } from "react";

import { GoldIcon } from "@/assets/icons/gold-icon";
import { MinionsIcon } from "@/assets/icons/minions-icon";
import { VisionIcon } from "@/assets/icons/vision-icon";
import type { IMatch } from "@/types/riot/i-match.type";

import { recentRecord, winRate } from "./summoner.utils";
import { SUMMONER_STAT_STRIP_PLACEHOLDER_SUBS } from "./summoner-stat-strip.constant";

interface ISummonerStatCellProps {
	/** The glyph, already coloured by what the figure measures. */
	icon: ReactNode;
	label: string;
	value: string;
	/** The line under the value: what it was measured over, or against. */
	sub: string;
}

/** One of the five figures. Its own cell, so the hairline grid can divide them. */
const SummonerStatCell = (props: ISummonerStatCellProps) => (
	<div className="bg-panel px-5 py-[18px]">
		<div className="flex items-center gap-[7px] font-mono text-[9.5px] text-ink-label tracking-[.18em]">
			{props.icon}
			{props.label}
		</div>
		<div className="mt-2 font-semibold text-[28px] text-ink tracking-[-.03em]">
			{props.value}
		</div>
		<div className="mt-[3px] font-mono text-[10px] text-ink-muted">
			{props.sub}
		</div>
	</div>
);

interface ISummonerStatStripProps {
	matches: IMatch[];
	puuid: string;
	/** The first page is still in flight, so the figures have nothing behind them. */
	loading: boolean;
}

/**
 * The five figures that answer "how is it going" before a single game is read.
 *
 * Every one of them is over the loaded matches, not the season: the strip sits
 * directly above the list it summarises, and the win rate subline says which
 * games so nobody reads it as a career figure.
 *
 * The cells are separated by the grid's own background showing through a 1px
 * gap rather than by borders — five cells with borders means either a doubled
 * line between each or a per-cell rule about which edge it owns.
 */
export const SummonerStatStrip = (props: ISummonerStatStripProps) => {
	const record = recentRecord(props.matches, props.puuid);
	const rate = winRate(record.wins, record.losses);
	// Deaths can legitimately average zero across a short sample.
	const kda =
		record.deaths === 0
			? null
			: (record.kills + record.assists) / record.deaths;

	// Held at their final shape while the first page loads, so the row below does
	// not jump 100px when the games land.
	const pending = props.loading || record.games === 0;
	const figure = (value: string) => (pending ? "—" : value);

	return (
		<div className="grid grid-cols-2 gap-px bg-edge md:grid-cols-3 lg:grid-cols-5">
			<SummonerStatCell
				icon={
					<PercentIcon className="size-3.5 text-victory" aria-hidden={true} />
				}
				label="WIN RATE"
				value={figure(`${rate}%`)}
				sub={
					pending
						? "NO GAMES LOADED"
						: `LAST ${record.games} · ${record.wins}W ${record.losses}L`
				}
			/>
			<SummonerStatCell
				icon={<TargetIcon className="size-3.5 text-kda" aria-hidden={true} />}
				label="KDA"
				value={figure(kda === null ? "Perfect" : kda.toFixed(2))}
				sub={
					pending
						? "—"
						: `${record.kills.toFixed(1)} / ${record.deaths.toFixed(1)} / ${record.assists.toFixed(1)}`
				}
			/>
			<SummonerStatCell
				icon={<MinionsIcon className="size-3.5 text-cs" aria-hidden={true} />}
				label="CS / MIN"
				value={figure(record.csPerMinute.toFixed(1))}
				// Placeholder: no endpoint serves a tier distribution. See the constant.
				sub={SUMMONER_STAT_STRIP_PLACEHOLDER_SUBS.csPerMinute}
			/>
			<SummonerStatCell
				icon={<GoldIcon className="size-3.5 text-gold" aria-hidden={true} />}
				label="GOLD / MIN"
				value={figure(record.goldPerMinute.toFixed(0))}
				// Placeholder: the lane opponent's rate is not aggregated. See the constant.
				sub={SUMMONER_STAT_STRIP_PLACEHOLDER_SUBS.goldPerMinute}
			/>
			<SummonerStatCell
				icon={
					<VisionIcon className="size-3.5 text-vision" aria-hidden={true} />
				}
				label="VISION"
				value={figure(record.visionScore.toFixed(0))}
				sub="PER GAME"
			/>
		</div>
	);
};
