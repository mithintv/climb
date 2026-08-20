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

/**
 * How many payloads one background chunk fetches.
 *
 * The expensive half of the work by a wide margin: ids come twenty to a call,
 * payloads one to a call. This figure and the tick below are the rate limit —
 * five every fifteen seconds is 40 calls a two-minute window, comfortably inside
 * a development key's 100 and leaving room for the requests a reader makes.
 */
export const ACCOUNT_MATCH_INGEST_CHUNK = 5;

/**
 * How often the background worker does a chunk of work.
 *
 * Paced rather than fast: nobody is waiting on it. The reader pressed update,
 * got their newest games from the head sync, and the deep history fills in
 * behind them.
 */
export const ACCOUNT_MATCH_WORKER_TICK_MS = 15 * 1000;
