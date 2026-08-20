import { HistoryIcon, SlidersHorizontalIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import {
	MATCH_HISTORY_FILTERS,
	type MatchHistoryFilter,
} from "./types/match-history-filter.type";

interface IMatchHistoryFilterBarProps {
	value: MatchHistoryFilter;
	onChange: (filter: MatchHistoryFilter) => void;
}

/**
 * The bar over the match list: what the list is, and which queues it is showing.
 *
 * It does not scroll with the games. The filter is the state the list is in,
 * and a control that describes what you are looking at has to stay visible
 * while you look at it.
 */
export const MatchHistoryFilterBar = (props: IMatchHistoryFilterBarProps) => (
	// Both values track the list below rather than being chosen here: the label
	// sits over the result bars and the filters over the chevrons, so the bar and
	// the cards have to inset by the same amount. The extra 8px on the right is
	// the list's scrollbar, which is drawn inside the scroll container's padding
	// and so pushes the cards in by that much further than this bar.
	<div className="flex items-center justify-between border-edge border-b bg-surface py-3 pr-5 pl-3">
		<h2 className="flex items-center gap-2 font-mono text-[10px] text-ink-label tracking-[.2em]">
			<HistoryIcon className="size-[15px]" aria-hidden={true} />
			MATCH HISTORY
		</h2>

		<div className="flex items-center gap-4 font-mono text-[10px] tracking-[.1em]">
			{MATCH_HISTORY_FILTERS.map((filter) => (
				<button
					key={filter.id}
					type="button"
					onClick={() => props.onChange(filter.id)}
					aria-pressed={filter.id === props.value}
					className={cn(
						"transition-colors hover:text-ink",
						filter.id === props.value ? "text-ink" : "text-ink-muted",
					)}
				>
					{filter.label}
				</button>
			))}
			{/* No panel behind it yet — the design puts it here for the filters that
			    do not fit as words (role, champion, date range), none of which are
			    built. It is rendered dim and inert rather than dropped, so the bar
			    keeps its shape. */}
			<SlidersHorizontalIcon
				className="size-4 text-ink-muted"
				aria-hidden={true}
			/>
		</div>
	</div>
);
