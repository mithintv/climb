import { HistoryIcon, RefreshCwIcon } from "lucide-react";

import type { ISyncStatus } from "@/components/summoner/use-summoner";
import { cn } from "@/lib/utils";

interface IMatchHistoryHeaderProps {
	/** Asks the backend to fetch this account's newer games from Riot. */
	onSync: () => void;
	/** A sync is running; the button says so and cannot be pressed again. */
	syncing: boolean;
	/** Why the last sync failed, or null. */
	syncError: string | null;
	/** What the last update did, or null if none has run this visit. */
	syncStatus: ISyncStatus | null;
}

/**
 * The bar over the match list: what the list is, which queue it holds, and the
 * control that fetches new games.
 *
 * The update button lives here because this is the pane it changes. Nothing else
 * in the app reaches Riot for a history — scrolling reads what has already been
 * saved — so the list is however current the last press left it, which is why
 * the button has to say what it did.
 *
 * It does not scroll with the games: the queue is stated rather than chosen, and
 * a list that silently excludes the ARAMs you played last night has to say so
 * while it is being read.
 */
export const MatchHistoryHeader = (props: IMatchHistoryHeaderProps) => {
	// Off while the request is in flight and while the worker is still filling
	// the history in behind it. Pressing again mid-fetch adds nothing — the head
	// is already current, and the work that is left is queued — so the button
	// would spend a Riot call to tell the reader what the line beside it says.
	const fetching = props.syncing || isFetching(props.syncStatus);

	return (
		// The label sits over the result bars, so the left inset matches the cards.
		// The right does not: the button goes to the pane's edge rather than lining
		// up with the chevrons, which would leave it floating short of the corner.
		<div className="flex items-center justify-between border-edge border-b bg-surface py-3 pl-3">
			<h2 className="flex items-center gap-2 font-mono text-[10px] text-ink-label tracking-[.2em]">
				<HistoryIcon className="size-3.75" aria-hidden={true} />
				MATCH HISTORY
			</h2>

			<div className="flex items-center gap-4 font-mono text-[10px] tracking-widest">
				{/* One line, whichever of the three it is: a failure, what the last press
			    found, or the queue. They answer the same question — what is in this
			    list — and stacking them would move the button between visits. */}
				<span
					className={cn(
						"whitespace-nowrap",
						props.syncError ? "text-defeat" : "text-ink-muted",
					)}
				>
					{props.syncError ?? summarise(props.syncStatus) ?? "RANKED SOLO/DUO"}
				</span>

				<button
					type="button"
					onClick={props.onSync}
					disabled={fetching}
					className="inline-flex items-center gap-2 border border-control px-3 py-1.5 text-ink-label tracking-[.14em] transition-colors hover:border-gold hover:text-gold disabled:opacity-50 disabled:hover:border-control disabled:hover:text-ink-label"
				>
					<RefreshCwIcon
						className={cn("size-3.5", fetching && "animate-spin")}
						aria-hidden={true}
					/>
					{fetching ? "UPDATING" : "UPDATE"}
				</button>
			</div>
		</div>
	);
};

/** Whether the backend still has games of this account's to fetch. */
const isFetching = (status: ISyncStatus | null) =>
	status !== null && (status.pending > 0 || !status.backfillComplete);

/**
 * How much the backend has left to fetch, once there is a figure worth showing.
 *
 * Only the count. Not "fetching" — the button beside it says that, spinning —
 * and nothing at all when there is nothing outstanding: the games are on screen,
 * which is the answer. Null falls through to the queue the list holds.
 */
const summarise = (status: ISyncStatus | null) => {
	if (!status || !isFetching(status) || status.pending === 0) return null;
	return `${status.pending} LEFT`;
};
