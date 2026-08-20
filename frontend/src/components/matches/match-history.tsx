import {
	type ISyncStatus,
	MATCH_PAGE_SIZE,
} from "@/components/summoner/use-summoner";
import type { IMatch } from "@/types/riot/i-match.type";

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
	/** Asks the backend to fetch newer games from Riot. */
	onSync: () => void;
	syncing: boolean;
	syncError: string | null;
	syncStatus: ISyncStatus | null;
}

/**
 * The right-hand pane: the header, and the ranked solo/duo games under it.
 *
 * The header is pinned and only the list scrolls, so the queue the list holds
 * is still stated when you are forty games down.
 *
 * Every game handed to it is already ranked solo/duo: the queue is a parameter
 * on the request, so nothing is filtered here.
 *
 * Scrolling it never reaches Riot — every page is a read of what the backend has
 * saved. New games arrive through the header's update button and nowhere else.
 */
export const MatchHistory = (props: IMatchHistoryProps) => {
	return (
		<section className="lg:grid lg:min-h-0 lg:grid-rows-[auto_1fr] lg:overflow-hidden">
			<MatchHistoryHeader
				onSync={props.onSync}
				syncing={props.syncing}
				syncError={props.syncError}
				syncStatus={props.syncStatus}
			/>

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
				<div className="min-w-220">
					<MatchList
						puuid={props.puuid}
						matches={props.matches}
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
