import { cn } from "@/lib/utils";
import type { ILeagueEntry } from "@/types/riot/i-league-entry.type";

import {
	formatRank,
	primaryEntry,
	SOLO_QUEUE,
	winRate,
} from "./summoner.utils";

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

interface ISummonerHeaderProps {
	gameName: string;
	tagLine: string;
	ranks: ILeagueEntry[];
}

export const SummonerHeader = (props: ISummonerHeaderProps) => {
	const entry = primaryEntry(props.ranks);

	return (
		<header className="flex flex-wrap items-end justify-between gap-4 border-white/10 border-b pb-4">
			<div>
				<h1 className="font-bold text-2xl text-foreground tracking-tight">
					{props.gameName}
					<span className="ml-1.5 font-medium text-lg text-muted-foreground">
						#{props.tagLine}
					</span>
				</h1>
			</div>

			{entry ? (
				<RankSummary entry={entry} />
			) : (
				<p className="text-muted-foreground text-sm">Unranked</p>
			)}
		</header>
	);
};

const RankSummary = (props: { entry: ILeagueEntry }) => {
	const { entry } = props;
	const rate = winRate(entry.wins, entry.losses);

	return (
		<div className="text-right">
			<p className="font-medium text-[11px] text-muted-foreground uppercase tracking-widest">
				{entry.queueType === SOLO_QUEUE ? "Ranked Solo" : entry.queueType}
			</p>
			<p
				className={cn(
					"font-bold text-lg leading-tight",
					TIER_COLOR[entry.tier] ?? "text-foreground",
				)}
			>
				{formatRank(entry)}
				<span className="ml-2 font-semibold text-foreground text-sm tabular-nums">
					{entry.leaguePoints} LP
				</span>
			</p>
			<p className="text-[11px] text-muted-foreground tabular-nums">
				{entry.wins}W {entry.losses}L
				{rate === null ? "" : ` · ${rate}% win rate`}
			</p>
		</div>
	);
};
