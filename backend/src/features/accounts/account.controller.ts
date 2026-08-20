import {
	BadRequestException,
	Controller,
	Get,
	Logger,
	type MessageEvent,
	Param,
	Post,
	Query,
	Sse,
} from "@nestjs/common";
import { concat, defer, map, type Observable, takeWhile } from "rxjs";

import type { AccountRow } from "./../../core/database/types/account-row.type.ts";
import { RiotApiService } from "./../../integrations/riot/riot-api.service.ts";
import { splitMatchId } from "./../../lib/split-match-id.ts";
import { AccountService } from "./account.service.ts";
import { AccountMatchService } from "./account-matches/account-match.service.ts";
import {
	AccountMatchBackfillWorker,
	type IAccountProgressEvent,
} from "./account-matches/account-match-backfill.worker.ts";
import {
	AccountMatchSyncService,
	type IAccountSyncStatus,
} from "./account-matches/account-match-sync.service.ts";

/** The response shape for an account, in the API's own casing. */
const toResponse = (account: AccountRow) => ({
	puuid: account.puuid,
	gameName: account.gameName,
	tagLine: account.tagLine,
});

@Controller("accounts")
export class AccountController {
	private readonly logger = new Logger(AccountController.name);
	private readonly accounts: AccountService;
	private readonly accountMatches: AccountMatchService;
	private readonly accountMatchSync: AccountMatchSyncService;
	private readonly backfill: AccountMatchBackfillWorker;
	private readonly riot: RiotApiService;

	constructor(
		accounts: AccountService,
		accountMatches: AccountMatchService,
		accountMatchSync: AccountMatchSyncService,
		backfill: AccountMatchBackfillWorker,
		riot: RiotApiService,
	) {
		this.accounts = accounts;
		this.accountMatches = accountMatches;
		this.accountMatchSync = accountMatchSync;
		this.backfill = backfill;
		this.riot = riot;
	}

	/**
	 * `GET /accounts?riotId=Name%23Tag` — the search entry point, and the only
	 * lookup that cannot be keyed by puuid, because resolving the puuid is the
	 * whole point of it.
	 */
	@Get()
	async getByRiotId(@Query("riotId") riotId?: string) {
		if (!riotId) {
			throw new BadRequestException("A riotId query parameter is required");
		}

		// Riot ids without a tag fall back to NA1; resolve it here so the logs
		// record the tag actually sent upstream.
		const [gameName, tagLine = "NA1"] = riotId.split("#");
		const { account, cached } = await this.accounts.resolveByRiotId(
			gameName,
			tagLine,
		);

		this.logger.debug(
			`Resolved ${gameName}#${tagLine} to a puuid (cached=${cached})`,
		);
		// gameName/tagLine carry Riot's casing, which the caller's spelling may not
		// match.
		return toResponse(account);
	}

	/**
	 * `GET /accounts/:puuid/rank` — current standing in every ranked queue.
	 * league-v4 is a snapshot with no history, so this is what a profile header
	 * shows; it is not, and cannot be turned into, per-match LP.
	 */
	@Get(":puuid/rank")
	async getRank(@Param("puuid") puuid: string) {
		const entries = await this.riot.fetchLeagueEntries(puuid);
		this.logger.debug(`Fetched ${entries.length} ranked entries`);
		return entries;
	}

	/**
	 * `POST /accounts/:puuid/sync` — fetches the account's newest games from Riot
	 * and hands the rest of its history to the background worker.
	 *
	 * Returns as soon as the head is in, which is the part someone is waiting for.
	 * `pending` and `backfillComplete` say how much the worker is still filling in
	 * behind it.
	 */
	@Post(":puuid/sync")
	async sync(@Param("puuid") puuid: string) {
		const result = await this.accountMatchSync.sync(puuid);
		this.backfill.enqueue(puuid);
		this.logger.debug(
			`Synced ${puuid}: ${result.indexed} new ids, ${result.pending} payloads outstanding`,
		);
		return result;
	}

	/**
	 * `GET /accounts/:puuid/sync/events` — the background worker's progress on
	 * this account, as server-sent events.
	 *
	 * Opens with where the account stands right now, so a client that connects
	 * between chunks — or after everything has already been fetched — is told
	 * immediately rather than waiting for a tick that may never come. After that
	 * it is one event per chunk, ending when the account reports itself done.
	 */
	@Sse(":puuid/sync/events")
	syncEvents(@Param("puuid") puuid: string): Observable<MessageEvent> {
		const current = defer(() => this.accountMatchSync.status(puuid));
		return concat(current, this.backfill.progressFor(puuid)).pipe(
			// `takeWhile` with the inclusive flag, so the event that says `done` is
			// itself delivered before the stream closes.
			takeWhile((progress) => !isDone(progress), true),
			map((progress) => ({ data: progress }) as MessageEvent),
		);
	}

	/**
	 * `GET /accounts/:puuid/matches?before=&start=&count=&queue=` — a page of the
	 * account's match ids, newest first.
	 *
	 * `before` is a match id and the cursor form; it is what a client paging
	 * through a history should send, because `start` counts from a head that
	 * moves as games finish. `start` still works, and the response is a plain
	 * array of ids either way.
	 *
	 * `queue` is Riot's own queue id — 420 for ranked solo/duo. It narrows what is
	 * served out of the database and nothing more; it never reaches Riot, and it
	 * has no effect on what a sync fetches.
	 *
	 * Served entirely from the index, so a short page means the index holds no
	 * more — not that the account has no more games. `POST :puuid/sync` is what
	 * changes that.
	 */
	@Get(":puuid/matches")
	async getMatchIds(
		@Param("puuid") puuid: string,
		@Query("start") start?: string,
		@Query("count") count?: string,
		@Query("before") before?: string,
		@Query("queue") queue?: string,
	) {
		const startIndex = Number(start) || 0;
		const pageSize = Number(count) || 5;
		const queueId = parseQueue(queue);

		const matchIds = await this.accountMatches.getMatchIds(puuid, {
			beforeGameId: parseCursor(before),
			queueId,
			start: startIndex,
			count: pageSize,
		});
		this.logger.debug(
			`Served ${matchIds.length} match ids (before=${before ?? "-"}, start=${startIndex}, count=${pageSize}, queue=${queueId ?? "any"})`,
		);
		return matchIds;
	}
}

/**
 * Reads the `before` cursor as the game id to page from.
 *
 * The cursor is a match id rather than a bare game id so a client can hand back
 * the last id it was served without taking it apart. It is only ever split
 * here — the id itself is never looked up, so a cursor naming a match the index
 * does not hold still pages from the right position.
 */
/**
 * Whether an account has nothing left to fetch.
 *
 * The worker's own events carry `done`; the opening snapshot does not, because
 * it is a status rather than a chunk — so it is derived the same way the worker
 * derives it.
 */
const isDone = (progress: IAccountSyncStatus | IAccountProgressEvent) =>
	"done" in progress
		? progress.done
		: progress.backfillComplete && progress.pending === 0;

/**
 * Reads the `queue` filter as a queue id, or undefined when none was asked for.
 *
 * Rejected rather than ignored when it is not a number: a typo that silently
 * served every queue would look like the filter working on an account that
 * happens to play nothing else.
 */
const parseQueue = (queue: string | undefined) => {
	if (queue === undefined || queue === "") return undefined;
	const queueId = Number(queue);
	if (!Number.isInteger(queueId) || queueId < 0) {
		throw new BadRequestException(`Not a queue id: ${queue}`);
	}
	return queueId;
};

const parseCursor = (before: string | undefined) => {
	if (!before) return undefined;
	try {
		return splitMatchId(before).gameId;
	} catch {
		throw new BadRequestException(`Not a match id: ${before}`);
	}
};
