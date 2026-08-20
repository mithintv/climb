/**
 * How long the newest end of a cached id list is trusted before Riot's list is
 * read again.
 *
 * Short because this is the one part of the index that goes stale: a completed
 * match never changes, but a game finishing adds an id at the head. A minute is
 * the resolution at which a just-finished game shows up, and it still collapses
 * the several id-list calls a page refresh used to make into one.
 */
export const ACCOUNT_MATCH_HEAD_TTL_MS = 60 * 1000;

/**
 * How many ids a sync fetches at once. Riot caps `count` at 100; 20 keeps a
 * head refresh that has to page cheap, since the common case rejoins the cached
 * set inside the first page.
 */
export const ACCOUNT_MATCH_PAGE_SIZE = 20;

/**
 * How far back into the ids already held a backfill page starts.
 *
 * Games played since the last sync shift every offset in Riot's list to the
 * right, so a backfill that started exactly at `synced_count` would skip that
 * many ids. Re-fetching the last few absorbs the shift, and duplicates cost
 * nothing — the unique constraint absorbs them, while a gap is silent and
 * permanent. The overlap is also the check: if it does not materialise, the
 * shift was larger than this and the page is refused.
 */
export const ACCOUNT_MATCH_BACKFILL_OVERLAP = 5;
