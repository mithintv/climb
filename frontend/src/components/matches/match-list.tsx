import { CircleChevronDownIcon } from "lucide-react";
import { useState } from "react";

import type { IMatch } from "@/types/riot/i-match.type";

import { Match, MatchSkeleton } from "./match";
import { useMatchListSentinel } from "./use-match-list-sentinel";

interface IMatchListProps {
	puuid: string;
	matches: IMatch[];
	loading: boolean;
	/** A further page is on its way; the skeletons go under the games, not over them. */
	loadingMore: boolean;
	/** A rate-limited page is waiting to be retried; nothing is in flight. */
	retrying: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
	/** How many games a page holds, so the button can say what it will fetch. */
	pageSize: number;
}

export const MatchList = (props: IMatchListProps) => {
	/**
	 * Which card's scoreboard is open, at most one at a time: two open panels
	 * push everything below them off the pane, and the whole point of the row
	 * above is that games are compared against each other.
	 *
	 * `undefined` means nobody has chosen yet, which is not the same as `null`
	 * for "closed" — the first game opens on arrival, and that has to survive
	 * being deliberately closed again.
	 */
	const [openMatchId, setOpenMatchId] = useState<string | null | undefined>(
		undefined,
	);
	const openId =
		openMatchId === undefined
			? props.matches[0]?.metadata.matchId
			: openMatchId;

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
			<div>
				{[0, 1, 2, 3, 4].map((placeholder) => (
					<MatchSkeleton key={placeholder} />
				))}
			</div>
		);
	}

	if (props.matches.length === 0) {
		return (
			<p className="py-16 text-center font-mono text-[10px] text-ink-muted tracking-[.12em]">
				NO GAMES IN THIS QUEUE
			</p>
		);
	}

	return (
		<div>
			{props.matches.map((match) => (
				<Match
					key={match.metadata.matchId}
					match={match}
					puuid={props.puuid}
					open={match.metadata.matchId === openId}
					onToggle={() =>
						setOpenMatchId(
							match.metadata.matchId === openId ? null : match.metadata.matchId,
						)
					}
				/>
			))}

			{props.loadingMore &&
				[0, 1, 2].map((placeholder) => <MatchSkeleton key={placeholder} />)}

			{props.hasMore && (
				// Given a real height so the observer has a rect to intersect rather
				// than a line sitting exactly on the scroll container's edge. The
				// button is not only a fallback: scrolling is not reachable from the
				// keyboard, so without it older games cannot be loaded at all.
				<div ref={sentinelRef} className="py-[26px] text-center">
					<button
						type="button"
						onClick={props.onLoadMore}
						disabled={props.loadingMore || props.retrying}
						className="inline-flex items-center gap-2 border border-control px-[22px] py-[11px] font-mono text-[10px] text-ink-label tracking-[.18em] transition-colors hover:border-gold hover:text-gold disabled:opacity-50 disabled:hover:border-control disabled:hover:text-ink-label"
					>
						<CircleChevronDownIcon className="size-[15px]" aria-hidden={true} />
						{props.retrying
							? "RATE LIMITED — RETRYING"
							: props.loadingMore
								? "LOADING"
								: `LOAD ${props.pageSize} MORE`}
					</button>
				</div>
			)}

			{!props.hasMore && (
				<p className="py-[26px] text-center font-mono text-[10px] text-ink-faint tracking-[.12em]">
					NO OLDER GAMES
				</p>
			)}
		</div>
	);
};
