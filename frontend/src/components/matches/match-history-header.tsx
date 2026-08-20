import { HistoryIcon } from "lucide-react";

/**
 * The bar over the match list: what the list is, and which queue it holds.
 *
 * It does not scroll with the games. There is no queue picker — the profile is
 * about ranked solo/duo and shows nothing else — so the queue is stated rather
 * than chosen, because a list of games that silently excludes the ARAMs you
 * played last night has to say so.
 */
export const MatchHistoryHeader = () => (
	// Both values track the list below rather than being chosen here: the label
	// sits over the result bars and the queue over the chevrons, so the bar and
	// the cards have to inset by the same amount. The extra 8px on the right is
	// the list's scrollbar, which is drawn inside the scroll container's padding
	// and so pushes the cards in by that much further than this bar.
	<div className="flex items-center justify-between border-edge border-b bg-surface py-3 pr-5 pl-3">
		<h2 className="flex items-center gap-2 font-mono text-[10px] text-ink-label tracking-[.2em]">
			<HistoryIcon className="size-3.75" aria-hidden={true} />
			MATCH HISTORY
		</h2>

		<span className="font-mono text-[10px] text-ink-muted tracking-widest">
			RANKED SOLO/DUO
		</span>
	</div>
);
