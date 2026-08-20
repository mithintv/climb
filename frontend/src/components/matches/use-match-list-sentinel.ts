import { useCallback, useEffect, useRef } from "react";

/**
 * The element that actually scrolls `node`, or null for the document.
 *
 * Resolved by walking up rather than passed in, because the profile has two
 * layouts and which one is live is a breakpoint decision made in CSS: from lg up
 * the match list scrolls inside its own column, below lg the document scrolls
 * and no ancestor has `overflow` at all.
 */
const findScrollParent = (node: HTMLElement): HTMLElement | null => {
	for (let parent = node.parentElement; parent; parent = parent.parentElement) {
		const overflowY = getComputedStyle(parent).overflowY;
		if (overflowY === "auto" || overflowY === "scroll") return parent;
	}
	return null;
};

/**
 * Calls `onReached` when the element the returned ref is attached to scrolls
 * into view — the trigger for loading another page of matches.
 *
 * The scrolling ancestor is used as the observer's root, not the viewport. This
 * is the part that is easy to get wrong: a target is clipped by every ancestor
 * with `overflow` *before* it is tested against the root, while `rootMargin`
 * expands only the root's own rect. Leaving the root as the viewport therefore
 * gives no early trigger inside a scrolling column — the margin expands a box
 * the sentinel was already clipped out of — and leaves the trigger sitting
 * exactly on the column's edge, where a short sentinel produces a degenerate
 * rect. Rooting the observer on the column that scrolls makes the margin mean
 * what it reads as.
 *
 * The root is resolved once, when the sentinel mounts. Crossing the lg
 * breakpoint by resizing mid-scroll therefore leaves it stale until the next
 * mount, which the list does on every page it loads.
 */
export const useMatchListSentinel = (
	onReached: () => void,
	enabled: boolean,
) => {
	/** Read inside the observer, so a new callback does not rebuild it. */
	const callback = useRef(onReached);
	callback.current = onReached;

	const observer = useRef<IntersectionObserver | null>(null);

	useEffect(() => () => observer.current?.disconnect(), []);

	// A ref callback rather than a ref object: the sentinel is only rendered
	// when there is more to load, so it mounts and unmounts, and an effect
	// keyed on a ref object would not see either.
	return useCallback(
		(node: HTMLElement | null) => {
			observer.current?.disconnect();
			if (!node || !enabled) return;

			observer.current = new IntersectionObserver(
				(entries) => {
					if (entries.some((entry) => entry.isIntersecting)) {
						callback.current();
					}
				},
				{ root: findScrollParent(node), rootMargin: "600px 0px" },
			);
			observer.current.observe(node);
		},
		[enabled],
	);
};
