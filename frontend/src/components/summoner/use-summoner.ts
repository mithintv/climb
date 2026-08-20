import { useCallback, useEffect, useRef, useState } from "react";

import type { ILeagueEntry } from "@/types/riot/i-league-entry.type";
import type { IMatch } from "@/types/riot/i-match.type";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3080";

/**
 * How many matches a page holds, on first paint and on every scroll after it.
 *
 * A full page is also how the hook knows more exist: the backend serves what its
 * index holds and backfills from Riot to fill the window, so a short page means
 * the account's history has run out rather than that the cache has.
 */
const MATCH_PAGE_SIZE = 10;

/**
 * How long to wait before the first retry of a rate-limited page, when the
 * backend did not forward a `Retry-After`. Doubles per attempt from here.
 */
const RETRY_BASE_MS = 5_000;

/**
 * How many times a rate-limited page is retried before the list gives up.
 *
 * Bounded rather than endless: a tab left open on a profile would otherwise
 * keep a rate limit alive by feeding it, and a reader who has walked away is
 * better served by a page that stopped than one still working.
 */
const MAX_RETRY_ATTEMPTS = 4;

/** A failed request, carrying what the retry decision needs. */
class RequestError extends Error {
	readonly status: number;
	/** From the backend's forwarded `Retry-After`; null when it sent none. */
	readonly retryAfterMs: number | null;

	constructor(status: number, path: string, retryAfterMs: number | null) {
		super(`${status} from ${path}`);
		this.name = "RequestError";
		this.status = status;
		this.retryAfterMs = retryAfterMs;
	}
}

/**
 * How long to wait before retrying, or null if this failure is not one to
 * retry — anything but a rate limit, or a rate limit already retried enough.
 *
 * Riot's own figure is preferred to the backoff whenever the backend forwarded
 * one: it is the upstream saying when the limit actually clears, where the
 * backoff is only a guess that avoids making things worse.
 */
const retryDelayMs = (error: unknown, attempt: number) => {
	if (!(error instanceof RequestError) || error.status !== 429) return null;
	if (attempt >= MAX_RETRY_ATTEMPTS) return null;
	return error.retryAfterMs ?? RETRY_BASE_MS * 2 ** attempt;
};

interface IAccount {
	puuid: string;
	gameName: string;
	tagLine: string;
}

export interface ISummonerData {
	account: IAccount | null;
	ranks: ILeagueEntry[];
	/** Full payloads, not ids — the champion stats aggregate over them. */
	matches: IMatch[];
	loading: boolean;
	error: string | null;
	/** A further page is being fetched; the first page is `loading` instead. */
	loadingMore: boolean;
	/**
	 * A page was rate limited and another attempt is scheduled. Distinct from
	 * `loadingMore`: nothing is in flight, and the list must not ask again in the
	 * meantime — asking is what keeps the limit alive.
	 */
	retrying: boolean;
	/** Whether asking for another page could return anything. */
	hasMore: boolean;
	/** Fetches the next page. Safe to call repeatedly; only the first one runs. */
	loadMore: () => void;
}

/**
 * The backend forwards Riot's `Retry-After` in the error body on a 429 and
 * nowhere else, so this only looks there. A body that is missing or not JSON is
 * not a failure — it just means the caller backs off on its own schedule.
 */
const readRetryAfterMs = async (response: Response) => {
	if (response.status !== 429) return null;
	try {
		const body = await response.json();
		const seconds = Number(body?.retryAfter);
		return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
	} catch {
		return null;
	}
};

const getJson = async (path: string) => {
	const response = await fetch(`${backendUrl}${path}`);
	if (!response.ok) {
		throw new RequestError(
			response.status,
			path,
			await readRetryAfterMs(response),
		);
	}
	return response.json();
};

/**
 * What to show when the first page fails outright.
 *
 * A rate limit is called out rather than folded into the generic message: it is
 * the one failure the reader can do something about, and "try again" is true of
 * it in a way it is not of a 500.
 */
const describeLoadFailure = (error: unknown) => {
	if (error instanceof RequestError && error.status === 404) {
		return "No summoner with that riot id.";
	}
	if (error instanceof RequestError && error.status === 429) {
		return "Riot is rate limiting requests right now. Try again in a minute.";
	}
	return "Could not load this summoner. Try again in a moment.";
};

const EMPTY: Omit<ISummonerData, "loadMore"> = {
	account: null,
	ranks: [],
	matches: [],
	loading: true,
	error: null,
	loadingMore: false,
	retrying: false,
	hasMore: false,
};

/**
 * Loads everything a profile page shows, a page of matches at a time.
 *
 * The match payloads are fetched here rather than inside each card so the
 * champion stats have something to aggregate — one request per match either
 * way, but the page owns the data.
 *
 * Pages are requested by cursor, not by offset. `before=<matchId>` names a
 * position in the history, so a game finishing while the user reads page one
 * cannot make page two repeat two games and silently skip two others; an
 * offset, counting from a head that moves, does exactly that.
 */
export const useSummoner = (gameName: string, tagLine: string) => {
	const [data, setData] = useState<Omit<ISummonerData, "loadMore">>(EMPTY);

	/**
	 * Which profile is being loaded. Incremented on every riot id change, so a
	 * response for a previous one is dropped rather than appended to whoever the
	 * user has since searched for.
	 */
	const profileId = useRef(0);
	/**
	 * Guards against a second page starting before the first has finished.
	 * A ref rather than `loadingMore`, because state has not been applied yet
	 * when two scroll events fire in the same frame.
	 */
	const fetching = useRef(false);
	/** Read by `loadMore`, which must not be rebuilt every time a page lands. */
	const snapshot = useRef(data);
	snapshot.current = data;
	/** The pending retry, so switching profile or unmounting can cancel it. */
	const retryTimer = useRef<number | null>(null);
	/** Consecutive rate-limited attempts at the same page; reset by a success. */
	const attempts = useRef(0);
	/** Lets a scheduled retry call `loadMore` without depending on it. */
	const retry = useRef(() => {});

	const cancelRetry = useCallback(() => {
		if (retryTimer.current === null) return;
		window.clearTimeout(retryTimer.current);
		retryTimer.current = null;
	}, []);

	/**
	 * One page of matches: the ids for the window, then a payload per id. A full
	 * page means there may be another; a short one is the end of the history.
	 */
	const fetchPage = useCallback(async (puuid: string, before?: string) => {
		const cursor = before ? `&before=${encodeURIComponent(before)}` : "";
		const matchIds = (await getJson(
			`/accounts/${puuid}/matches?count=${MATCH_PAGE_SIZE}${cursor}`,
		)) as string[];

		const matches = await Promise.all(
			matchIds.map((id) => getJson(`/matches/${id}`) as Promise<IMatch>),
		);

		return { matches, hasMore: matchIds.length === MATCH_PAGE_SIZE };
	}, []);

	useEffect(() => {
		const id = ++profileId.current;
		fetching.current = false;
		attempts.current = 0;
		cancelRetry();

		const load = async () => {
			setData(EMPTY);

			try {
				const account: IAccount = await getJson(
					`/accounts?riotId=${encodeURIComponent(`${gameName}#${tagLine}`)}`,
				);
				if (profileId.current !== id) return;
				setData((previous) => ({ ...previous, account }));

				const [ranks, page] = await Promise.all([
					getJson(`/accounts/${account.puuid}/rank`) as Promise<ILeagueEntry[]>,
					fetchPage(account.puuid),
				]);
				if (profileId.current !== id) return;

				setData({
					account,
					ranks,
					matches: page.matches,
					loading: false,
					error: null,
					loadingMore: false,
					retrying: false,
					hasMore: page.hasMore,
				});
			} catch (error) {
				if (profileId.current !== id) return;
				console.error("Failed to load summoner", { gameName, tagLine, error });
				setData({
					...EMPTY,
					loading: false,
					error: describeLoadFailure(error),
				});
			}
		};

		load();
		return () => {
			// Bumping it is the cancellation: nothing in flight can match it again.
			profileId.current += 1;
			cancelRetry();
		};
	}, [gameName, tagLine, fetchPage, cancelRetry]);

	const loadMore = useCallback(() => {
		const current = snapshot.current;
		const last = current.matches[current.matches.length - 1];
		if (
			fetching.current ||
			current.loading ||
			!current.hasMore ||
			!current.account ||
			!last
		) {
			return;
		}

		const id = profileId.current;
		const puuid = current.account.puuid;
		fetching.current = true;
		setData((previous) => ({ ...previous, loadingMore: true }));

		const run = async () => {
			try {
				const page = await fetchPage(puuid, last.metadata.matchId);
				if (profileId.current !== id) return;

				setData((previous) => {
					// The cursor should make this impossible, but a repeated id would
					// duplicate a React key, so it is filtered rather than trusted.
					const seen = new Set(
						previous.matches.map((match) => match.metadata.matchId),
					);
					return {
						...previous,
						matches: [
							...previous.matches,
							...page.matches.filter(
								(match) => !seen.has(match.metadata.matchId),
							),
						],
						loadingMore: false,
						retrying: false,
						hasMore: page.hasMore,
					};
				});
				attempts.current = 0;
			} catch (error) {
				if (profileId.current !== id) return;

				const delay = retryDelayMs(error, attempts.current);
				if (delay !== null) {
					attempts.current += 1;
					// Held rather than abandoned: a rate limit is the upstream asking
					// for a pause, not a refusal, so `hasMore` stays true and the page
					// is asked for again once the pause is over.
					setData((previous) => ({
						...previous,
						loadingMore: false,
						retrying: true,
					}));
					retryTimer.current = window.setTimeout(() => {
						retryTimer.current = null;
						if (profileId.current !== id) return;
						setData((previous) => ({ ...previous, retrying: false }));
						retry.current();
					}, delay);
					return;
				}

				console.error("Failed to load more matches", { puuid, error });
				// Stops the scroll from retrying the same failing page forever. The
				// games already loaded stay on screen.
				setData((previous) => ({
					...previous,
					loadingMore: false,
					retrying: false,
					hasMore: false,
				}));
			} finally {
				if (profileId.current === id) fetching.current = false;
			}
		};

		run();
	}, [fetchPage]);

	// Assigned rather than passed, so a scheduled retry reaches the current
	// `loadMore` without the retry timer becoming one of its dependencies.
	retry.current = loadMore;

	return { ...data, loadMore };
};
