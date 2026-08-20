import { MATCH_PAGE_SIZE } from "@/components/summoner/use-summoner";
import type { IMatch } from "@/types/riot/i-match.type";

import { RANKED_SOLO_QUEUE_ID } from "./constants/ranked-solo-queue.constant";
import { MatchHistoryHeader } from "./match-history-header";
import { MatchList } from "./match-list";

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
 * The right-hand pane: the header, and the ranked solo/duo games under it.
 *
 * The header is pinned and only the list scrolls, so the queue the list holds
 * is still stated when you are forty games down.
 *
 * The queue is applied to the games already loaded rather than asked of the
 * backend — `match-v5` takes a `queue` parameter that the backend's index does
 * not pass through yet. The visible consequence is that a page of ten games can
 * arrive holding two solo queue games, and "load more" fetches the next ten of
 * everything rather than the next ten ranked.
 */
export const MatchHistory = (props: IMatchHistoryProps) => {
	const shown = props.matches.filter(
		(match) => match.info.queueId === RANKED_SOLO_QUEUE_ID,
	);

	return (
		<section className="lg:grid lg:min-h-0 lg:grid-rows-[auto_1fr] lg:overflow-hidden">
			<MatchHistoryHeader />

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
