import { Injectable, Logger } from "@nestjs/common";

import { RiotApiService } from "./../../../integrations/riot/riot-api.service.ts";
import { MatchService } from "./../../matches/match.service.ts";
import { AccountRepository } from "./../account.repository.ts";
import { AccountMatchRepository } from "./account-match.repository.ts";
import {
	mergeBackfillPage,
	mergeHeadPage,
} from "./account-match-merge.utils.ts";
import {
	ACCOUNT_MATCH_BACKFILL_OVERLAP,
	ACCOUNT_MATCH_INGEST_CHUNK,
	ACCOUNT_MATCH_PAGE_SIZE,
} from "./account-match-sync.constant.ts";

/** How much of an account's history is on disk. */
export interface IAccountSyncStatus {
	/** Ids holding no payload yet. Zero with `backfillComplete` means done. */
	pending: number;
	/** Whether the oldest end of Riot's list has been reached. */
	backfillComplete: boolean;
}

/** What a press of update did, and what is left for the worker to finish. */
export interface IAccountSyncResult extends IAccountSyncStatus {
	/** New ids at the head — games played since the last sync. */
	indexed: number;
}

/** What one chunk of background work did. */
export interface IAccountSyncProgress extends IAccountSyncStatus {
	/** Ids added by reaching one page deeper into Riot's list. */
	indexed: number;
	/** Payloads fetched and saved. */
	ingested: number;
	/** Whether this account has anything left to do. */
	done: boolean;
}

/**
 * Fetches an account's history from Riot: the newest games on request, the rest
 * in the background.
 *
 * The only place the app calls Riot for a history. Reads are database queries
 * against what this has already saved (`AccountMatchService`).
 *
 * The split is what a person is waiting for. `sync` is the head of the list —
 * one call, the games played since last time — and it returns. `advance` is one
 * chunk of everything else, called on a timer by `AccountMatchBackfillWorker`
 * until the account is complete; a history is hundreds of payload calls, and
 * nobody should hold a request open for that or press a button to get it.
 */
@Injectable()
export class AccountMatchSyncService {
	private readonly logger = new Logger(AccountMatchSyncService.name);
	private readonly accounts: AccountRepository;
	private readonly accountMatches: AccountMatchRepository;
	private readonly riot: RiotApiService;
	/** Fetches a payload and saves it; the sync only wants the saving. */
	private readonly matchPayloads: MatchService;

	constructor(
		accounts: AccountRepository,
		accountMatches: AccountMatchRepository,
		riot: RiotApiService,
		matchPayloads: MatchService,
	) {
		this.accounts = accounts;
		this.accountMatches = accountMatches;
		this.riot = riot;
		this.matchPayloads = matchPayloads;
	}

	/**
	 * Brings the newest end of the account's history up to date, and reports what
	 * is left.
	 *
	 * This is the press of a button, so it does the part someone is waiting for
	 * and nothing else: their last few games. Deep history and payloads are the
	 * worker's, and `pending` is what tells the caller it is still working.
	 *
	 * `now` is a parameter rather than a `Date.now()` call so the timestamps are
	 * assertable in a test.
	 */
	async sync(
		puuid: string,
		now: number = Date.now(),
	): Promise<IAccountSyncResult> {
		const accountId = await this.requireAccountId(puuid);
		const indexed = await this.syncHead(accountId, puuid, now);
		const status = await this.readStatus(accountId);

		this.logger.log(
			`Synced the head for ${puuid}: ${indexed} new ids, ${status.pending} payloads outstanding`,
		);
		return { indexed, ...status };
	}

	/**
	 * One chunk of background work: a few payloads, and a page deeper into the
	 * history only once none are outstanding.
	 *
	 * Payloads first, and exclusively, because they are what a reader can see. A
	 * chunk that did both would index twenty ids while fetching five payloads,
	 * so the outstanding count would climb by fifteen a tick — the account would
	 * report more and more work while the screen stayed empty, which is exactly
	 * backwards.
	 *
	 * Reaching deeper waits for the count to hit zero rather than merely fall,
	 * so a run of failing payload fetches cannot be answered by piling more ids
	 * on top of them. Newest payloads first, since that is the end anyone is
	 * looking at.
	 */
	async advance(
		puuid: string,
		now: number = Date.now(),
	): Promise<IAccountSyncProgress> {
		const accountId = await this.requireAccountId(puuid);
		const ingested = await this.ingestChunk(accountId, now);
		const caughtUp = await this.readStatus(accountId);

		const indexed =
			caughtUp.pending === 0
				? await this.backfillOnce(accountId, puuid, now)
				: 0;
		const status = indexed > 0 ? await this.readStatus(accountId) : caughtUp;

		return {
			indexed,
			ingested,
			...status,
			done: status.backfillComplete && status.pending === 0,
		};
	}

	/**
	 * How much of the account is on disk, without touching Riot.
	 *
	 * What the event stream opens with. An account nothing has synced reports
	 * nothing outstanding — there is no work queued for it, and saying otherwise
	 * would leave a client waiting on chunks that are never coming.
	 */
	async status(puuid: string): Promise<IAccountSyncStatus> {
		const account = await this.accounts.findByPuuid(puuid);
		if (!account) return { pending: 0, backfillComplete: true };
		return this.readStatus(account.id);
	}

	/** The accounts with work outstanding, so a restart picks up where it left off. */
	async listAccountsNeedingWork() {
		return this.accountMatches.listAccountsNeedingWork();
	}

	private async readStatus(accountId: number): Promise<IAccountSyncStatus> {
		const sync = await this.accountMatches.ensureSync(accountId);
		const pending =
			await this.accountMatches.countUningestedMatchIds(accountId);
		return { pending, backfillComplete: sync.backfillComplete };
	}

	/**
	 * The account's row id.
	 *
	 * The index hangs off one, and a row cannot be written from a puuid alone —
	 * the name columns are `NOT NULL` and only account-v1 knows them. Every caller
	 * resolves the account before syncing it.
	 */
	private async requireAccountId(puuid: string) {
		const account = await this.accounts.findByPuuid(puuid);
		if (!account)
			throw new Error(`No account row for ${puuid}; resolve it first`);
		return account.id;
	}

	/**
	 * Reads the newest end of Riot's list and writes what is new, returning how
	 * many ids that was.
	 *
	 * Pages forward while every id returned is new, since that means more games
	 * were played than the window covers and a gap may sit past it. Nothing new
	 * played is one call.
	 *
	 * Unconditional: a sync is someone asking for their newest games, so a TTL
	 * here would answer the request by declining it.
	 */
	private async syncHead(accountId: number, puuid: string, now: number) {
		const sync = await this.accountMatches.ensureSync(accountId);
		let added = 0;
		let startOffset = 0;

		for (;;) {
			const page = await this.riot.fetchMatchIds(
				puuid,
				startOffset,
				ACCOUNT_MATCH_PAGE_SIZE,
			);
			const known = await this.accountMatches.findKnown(accountId, page);
			const merge = mergeHeadPage(known, page, {
				pageSize: ACCOUNT_MATCH_PAGE_SIZE,
				syncedCount: sync.syncedCount,
			});

			added += await this.accountMatches.insertIds(accountId, merge.fresh, now);
			if (!merge.keepPaging) break;
			startOffset += ACCOUNT_MATCH_PAGE_SIZE;
		}

		await this.accountMatches.refreshSync(accountId, { headSyncedAt: now });
		return added;
	}

	/**
	 * Fetches one page deeper into Riot's list, and reports how many ids it added.
	 *
	 * The page starts a few ids back inside what is held so the shift caused by
	 * games played since the last sync is absorbed. When the overlap does not
	 * materialise the shift was larger than that, and writing the page would
	 * leave a hole; the head is resynced to take up the shift and the page is
	 * retried once. A second failure is left alone rather than guessed at — a
	 * chunk that did nothing is retried on the next tick, while a gap would be
	 * permanent.
	 */
	private async backfillOnce(
		accountId: number,
		puuid: string,
		now: number,
		retried = false,
	): Promise<number> {
		const sync = await this.accountMatches.ensureSync(accountId);
		if (sync.backfillComplete) return 0;

		const startOffset = Math.max(
			0,
			sync.syncedCount - ACCOUNT_MATCH_BACKFILL_OVERLAP,
		);
		const page = await this.riot.fetchMatchIds(
			puuid,
			startOffset,
			ACCOUNT_MATCH_PAGE_SIZE,
		);
		const known = await this.accountMatches.findKnown(accountId, page);
		const merge = mergeBackfillPage(known, page, {
			startOffset,
			requested: ACCOUNT_MATCH_PAGE_SIZE,
		});

		if (!merge.overlapSeen) {
			if (retried) {
				this.logger.warn(
					`Backfill for ${puuid} found no overlap at start=${startOffset} after a head resync; skipping this chunk rather than writing a gap`,
				);
				return 0;
			}
			await this.syncHead(accountId, puuid, now);
			return this.backfillOnce(accountId, puuid, now, true);
		}

		const added = await this.accountMatches.insertIds(
			accountId,
			merge.fresh,
			now,
		);
		await this.accountMatches.refreshSync(
			accountId,
			merge.complete ? { backfillComplete: true } : {},
		);

		return added;
	}

	/**
	 * Fetches payloads for indexed ids that have none, newest first, and returns
	 * how many were saved.
	 *
	 * One at a time, and a failure ends the chunk rather than skipping the id: it
	 * keeps its place in the queue and the next tick tries it again, where
	 * skipping would leave a hole nothing goes looking for.
	 */
	private async ingestChunk(accountId: number, now: number) {
		const pending = await this.accountMatches.listUningestedMatchIds(
			accountId,
			ACCOUNT_MATCH_INGEST_CHUNK,
		);
		let ingested = 0;

		for (const matchId of pending) {
			try {
				await this.matchPayloads.getMatchBody(matchId, now);
				ingested += 1;
			} catch (error) {
				this.logger.warn(
					`Stopped ingesting at ${matchId} after ${ingested} payloads`,
					error,
				);
				break;
			}
		}

		return ingested;
	}
}
