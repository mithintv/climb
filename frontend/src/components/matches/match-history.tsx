import { useState } from "react";

import { MATCH_PAGE_SIZE } from "@/components/summoner/use-summoner";
import type { IMatch } from "@/types/riot/i-match.type";

import { MatchHistoryFilterBar } from "./match-history-filter-bar";
import { MatchList } from "./match-list";
import {
	MATCH_HISTORY_FILTERS,
	type MatchHistoryFilter,
} from "./types/match-history-filter.type";

interface IMatchHistoryProps {
	puuid: string;
	matches: IMatch[];
	loading: boolean;
	loadingMore: boolean;
	retrying: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
}

/**
 * The right-hand pane: the filter bar, and the games under it.
 *
 * The bar is pinned and only the list scrolls, so the queue you have filtered
 * to is still stated when you are forty games down.
 *
 * The filter narrows the games already loaded rather than asking the backend
 * for a queue — `match-v5` takes a `queue` parameter that the backend's index
 * does not pass through yet. The visible consequence is that filtering to a
 * rare queue can empty a full page, and "load more" fetches the next ten of
 * everything rather than the next ten of that queue.
 */
export const MatchHistory = (props: IMatchHistoryProps) => {
	const [filterId, setFilterId] = useState<MatchHistoryFilter>("all");
	const filter = MATCH_HISTORY_FILTERS.find((entry) => entry.id === filterId);
	const queueIds = filter?.queueIds;

	// Widened from the constant's literal tuple, which `includes` would otherwise
	// only accept its own literal members against.
	const shown = queueIds
		? props.matches.filter((match) =>
				(queueIds as readonly number[]).includes(match.info.queueId),
			)
		: props.matches;

	return (
		<section className="lg:grid lg:min-h-0 lg:grid-rows-[auto_1fr] lg:overflow-hidden">
			<MatchHistoryFilterBar value={filterId} onChange={setFilterId} />

			{/* Scrolls in both directions: the card's columns need about 880px before
			    the figures start colliding, and a narrow window is better served by
			    a horizontal scrollbar than by a row that silently reflows into
			    something that no longer lines up with the rows above it.

			    No max width and no auto margin. The handoff capped this at 1280px
			    and centred it, which meant the page had two ways of insetting the
			    match column — the gutter, and the slack either side of the cap —
			    and the slack absorbed the gutter silently: widening the gutter on a
			    wide window moved the rail and left the games where they were. The
			    gutter is the only control now. */}
			<div className="overflow-x-auto pr-3 pb-10 pl-3 lg:min-h-0 lg:overflow-y-auto">
				<div className="min-w-[880px]">
					<MatchList
						puuid={props.puuid}
						matches={shown}
						loading={props.loading}
						loadingMore={props.loadingMore}
						retrying={props.retrying}
						hasMore={props.hasMore}
						onLoadMore={props.onLoadMore}
						pageSize={MATCH_PAGE_SIZE}
					/>
				</div>
			</div>
		</section>
	);
};
