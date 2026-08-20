import { Injectable, Logger } from "@nestjs/common";

import { RiotApiService } from "./../../../integrations/riot/riot-api.service.ts";
import { AccountRepository } from "./../account.repository.ts";
import { AccountMatchRepository } from "./account-match.repository.ts";
import {
	mergeBackfillPage,
	mergeHeadPage,
} from "./account-match-merge.utils.ts";
import {
	ACCOUNT_MATCH_BACKFILL_OVERLAP,
	ACCOUNT_MATCH_HEAD_TTL_MS,
	ACCOUNT_MATCH_PAGE_SIZE,
} from "./account-match-sync.constant.ts";

/** Which window of a player's match ids to serve, newest first. */
export interface IMatchIdRequest {
	/**
	 * Serve the ids older than this match id. Preferred to `start`: an offset
	 * counts from a head that moves, so two games finishing between page 1 and
	 * page 2 make the client see two ids twice and never see two others.
	 */
	beforeGameId?: number;
	start: number;
	count: number;
}

/**
 * Serves a player's match ids out of `account_matches`, calling Riot only to
 * keep that index current.
 *
 * The index is the source the route reads. Riot's own id list is read in two
 * places only: the newest end, on a TTL, because a finished game adds an id
 * there; and the oldest end, when a caller asks for a window deeper than the
 * index reaches. Everything else is a database read.
 */
@Injectable()
export class AccountMatchService {
	private readonly logger = new Logger(AccountMatchService.name);
	private readonly accounts: AccountRepository;
	private readonly accountMatches: AccountMatchRepository;
	private readonly riot: RiotApiService;

	constructor(
		accounts: AccountRepository,
		accountMatches: AccountMatchRepository,
		riot: RiotApiService,
	) {
		this.accounts = accounts;
		this.accountMatches = accountMatches;
		this.riot = riot;
	}

	/**
	 * A window of the player's match ids, newest first.
	 *
	 * `now` is a parameter rather than a `Date.now()` call so the head TTL
	 * boundary is testable without waiting a minute.
	 */
	async getMatchIds(
		puuid: string,
		request: IMatchIdRequest,
		now: number = Date.now(),
	): Promise<string[]> {
		const account = await this.accounts.findByPuuid(puuid);
		if (!account) {
			// The index hangs off an account row, and one cannot be written from a
			// puuid alone — the name columns are `NOT NULL` and only account-v1
			// knows them. Every caller resolves the account before asking for its
			// matches, so this is a defensive passthrough rather than a path the
			// app takes; it is served uncached, with the offset paging bug intact.
			this.logger.warn(
				`No account row for ${puuid}; serving match ids straight from Riot`,
			);
			return this.riot.fetchMatchIds(puuid, request.start, request.count);
		}

		await this.syncHead(account.id, puuid, now);
		return this.readWindow(account.id, puuid, request, now);
	}

	/**
	 * Brings the newest end of the index up to date, if the TTL has expired.
	 *
	 * Pages forward while every id returned is new, since that means more games
	 * were played than the window covers and a gap may sit past it. `force`
	 * ignores the TTL, which is how a backfill that found its offsets shifted
	 * gets them realigned before trying again.
	 */
	private async syncHead(
		accountId: number,
		puuid: string,
		now: number,
		force = false,
	) {
		const sync = await this.accountMatches.ensureSync(accountId);
		if (!force && now - sync.headSyncedAt < ACCOUNT_MATCH_HEAD_TTL_MS) return;

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

			await this.accountMatches.insertIds(accountId, merge.fresh, now);
			if (!merge.keepPaging) break;
			startOffset += ACCOUNT_MATCH_PAGE_SIZE;
		}

		await this.accountMatches.refreshSync(accountId, { headSyncedAt: now });
	}

	/**
	 * Reads the window, backfilling until it can be filled or there is nothing
	 * left to fill it with.
	 *
	 * Retrying the read rather than computing how deep the window reaches keeps
	 * the cursor and offset forms on one path: both are short for the same
	 * reason, and both are satisfied by the same extra page. The loop terminates
	 * because a backfill reports progress only when it actually added ids, and
	 * Riot's list is finite.
	 */
	private async readWindow(
		accountId: number,
		puuid: string,
		request: IMatchIdRequest,
		now: number,
	) {
		for (;;) {
			const matchIds = await this.accountMatches.listMatchIds(
				accountId,
				request,
			);
			if (matchIds.length >= request.count) return matchIds;

			const progressed = await this.backfillOnce(accountId, puuid, now);
			if (!progressed) return matchIds;
		}
	}

	/**
	 * Fetches one page deeper into Riot's list, and reports whether the index
	 * grew.
	 *
	 * The page starts a few ids back inside what is held so the shift caused by
	 * games played since the last sync is absorbed. When the overlap does not
	 * materialise the shift was larger than that, and writing the page would
	 * leave a hole; the head is resynced to take up the shift and the page is
	 * retried once. A second failure is left alone rather than guessed at — the
	 * window comes back short, which is recoverable, while a gap would not be.
	 */
	private async backfillOnce(
		accountId: number,
		puuid: string,
		now: number,
		retried = false,
	): Promise<boolean> {
		const sync = await this.accountMatches.ensureSync(accountId);
		if (sync.backfillComplete) return false;

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
					`Backfill for ${puuid} found no overlap at start=${startOffset} after a head resync; leaving the window short rather than writing a gap`,
				);
				return false;
			}
			await this.syncHead(accountId, puuid, now, true);
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

		return added > 0;
	}
}
