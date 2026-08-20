import type { IMatch } from "@/types/riot/i-match.type";

import { Match, MatchSkeleton } from "./match";
import { useMatchListSentinel } from "./use-match-list-sentinel";

interface MatchListProps {
	puuid: string;
	matches: IMatch[];
	loading: boolean;
	/** A further page is on its way; the skeletons go under the games, not over them. */
	loadingMore: boolean;
	/** A rate-limited page is waiting to be retried; nothing is in flight. */
	retrying: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
}

export const MatchList = (props: MatchListProps) => {
	// Armed only while there is a page left to fetch and none in flight, so the
	// sentinel scrolling past during a fetch does not queue a second one. Also
	// disarmed while a retry is pending: asking again mid-rate-limit is what
	// keeps the limit alive.
	const sentinelRef = useMatchListSentinel(
		props.onLoadMore,
		props.hasMore && !props.loadingMore && !props.retrying,
	);

	if (props.loading) {
		return (
			<div className="flex flex-col gap-2">
				{[0, 1, 2, 3, 4].map((placeholder) => (
					<MatchSkeleton key={placeholder} />
				))}
			</div>
		);
	}

	if (props.matches.length === 0) {
		return (
			<p className="rounded-lg border border-gold/25 bg-card/40 card-raised px-4 py-6 text-center text-muted-foreground text-sm">
				No recent matches.
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{props.matches.map((match) => (
				<Match key={match.metadata.matchId} match={match} puuid={props.puuid} />
			))}

			{props.loadingMore &&
				[0, 1, 2].map((placeholder) => <MatchSkeleton key={placeholder} />)}

			{props.hasMore && (
				// Given a real height so the observer has a rect to intersect rather
				// than a line sitting exactly on the scroll container's edge. The
				// button is not only a fallback: scrolling is not reachable from the
				// keyboard, so without it older games cannot be loaded at all.
				<div ref={sentinelRef} className="flex justify-center py-4">
					<button
						type="button"
						onClick={props.onLoadMore}
						disabled={props.loadingMore || props.retrying}
						className="rounded-lg border border-gold/25 bg-card/40 px-4 py-2 text-muted-foreground text-xs transition-colors hover:text-foreground disabled:opacity-50"
					>
						{props.retrying
							? "Rate limited — retrying shortly…"
							: props.loadingMore
								? "Loading…"
								: "Load older games"}
					</button>
				</div>
			)}

			{!props.hasMore && (
				<p className="py-4 text-center text-muted-foreground text-xs">
					No older games.
				</p>
			)}
		</div>
	);
};
