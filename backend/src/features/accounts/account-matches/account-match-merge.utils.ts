/**
 * The decisions a fetched page of match ids leads to, taken as pure functions of
 * the page and what the index already holds.
 *
 * They are separated from the repository and the Riot client because they are
 * the only part of the sync that can be wrong in a way nothing later notices: a
 * duplicate id is absorbed by `account_matches`' unique constraint, but a gap
 * between what was fetched and what was held is silent and permanent. Keeping
 * the rules pure is what makes the gap cases directly testable.
 */

/** What a page of the newest end of Riot's list leaves to do. */
export interface IHeadPageMerge {
	/** Ids in the page the index does not hold yet, in Riot's order. */
	fresh: string[];
	/**
	 * Whether the next page has to be fetched before the head can be called
	 * synced.
	 */
	keepPaging: boolean;
}

/**
 * Merges a page of the newest end of Riot's list into the index.
 *
 * `known` only has to cover `page` — it is the answer to "which of these ids do
 * we already hold", not the whole index, so a head refresh never loads a full
 * history into memory to write twenty ids.
 *
 * Paging continues only while every id on the page is new. One already-known id
 * is the join between the page and the cached set, which proves nothing sits
 * between them; a page of nothing but new ids proves the opposite — more games
 * were played than the window covers, so a gap may sit just past it.
 *
 * Two cases stop it anyway. A short page is the end of Riot's list, so there is
 * no next page. And an index holding nothing has no cached set to rejoin, so
 * every page would be all-new and the head refresh would walk the entire
 * history — that walk is the backfill's job, bounded and resumable, so the head
 * takes one page and leaves the rest to it.
 */
export const mergeHeadPage = (
	known: ReadonlySet<string>,
	page: readonly string[],
	options: { pageSize: number; syncedCount: number },
): IHeadPageMerge => {
	const fresh = page.filter((id) => !known.has(id));

	return {
		fresh,
		keepPaging:
			options.syncedCount > 0 &&
			fresh.length === page.length &&
			page.length >= options.pageSize,
	};
};

/** What a page of the oldest end of Riot's list leaves to do. */
export interface IBackfillPageMerge {
	/** Ids in the page the index does not hold yet, in Riot's order. */
	fresh: string[];
	/**
	 * Whether the deliberate overlap with the ids already held actually showed
	 * up. False means offsets shifted further than the overlap covers and the
	 * page cannot be written: the ids between it and the index would never be
	 * fetched.
	 */
	overlapSeen: boolean;
	/** Riot returned fewer ids than asked for, so this is the tail of the list. */
	complete: boolean;
}

/**
 * Merges a page of the oldest end of Riot's list into the index.
 *
 * The page is fetched starting a few ids back inside what is already held, so
 * its first id must be one of them. If it is not, games played since the last
 * sync shifted every offset right by more than the overlap, and writing the page
 * would leave a hole between it and the index — so the caller is told to refresh
 * the head first and try again rather than being handed rows to write.
 *
 * At offset 0 there is nothing before the page for it to overlap with, and an
 * empty page cannot show an overlap it has no room for; neither is a gap.
 */
export const mergeBackfillPage = (
	known: ReadonlySet<string>,
	page: readonly string[],
	options: { startOffset: number; requested: number },
): IBackfillPageMerge => ({
	fresh: page.filter((id) => !known.has(id)),
	overlapSeen:
		options.startOffset === 0 || page.length === 0 || known.has(page[0]),
	complete: page.length < options.requested,
});
