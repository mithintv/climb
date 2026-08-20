import { Injectable, Logger } from "@nestjs/common";

import { AccountRepository } from "./../account.repository.ts";
import { AccountMatchRepository } from "./account-match.repository.ts";

/** Which window of a player's match ids to serve, newest first. */
export interface IMatchIdRequest {
	/**
	 * Serve only games in this queue, e.g. 420 for ranked solo/duo. Every queue
	 * when absent.
	 *
	 * Applied by the index read, which joins the saved payloads to get at the
	 * queue — the queue is on the match, not on the id.
	 */
	queueId?: number;
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
 * Serves a player's match ids out of `account_matches`.
 *
 * Reads only, and never Riot. Scrolling a history is a database query however
 * far it goes: what the account has, and how much of it, is decided by a sync
 * the reader asks for (`AccountMatchSyncService`), not by the page they happen
 * to have scrolled to. That separation is the point — a filter that reached
 * upstream would make an idle scroll spend a rate limit, and would make what is
 * on screen depend on how fast someone scrolled.
 *
 * The consequence to hold on to: a short page means the index holds no more,
 * not that the account has no more games. Only a sync changes that.
 */
@Injectable()
export class AccountMatchService {
	private readonly logger = new Logger(AccountMatchService.name);
	private readonly accounts: AccountRepository;
	private readonly accountMatches: AccountMatchRepository;

	constructor(
		accounts: AccountRepository,
		accountMatches: AccountMatchRepository,
	) {
		this.accounts = accounts;
		this.accountMatches = accountMatches;
	}

	/** A window of the player's match ids, newest first. */
	async getMatchIds(
		puuid: string,
		request: IMatchIdRequest,
	): Promise<string[]> {
		const account = await this.accounts.findByPuuid(puuid);
		if (!account) {
			// Nothing has ever been synced for this puuid, which is a different thing
			// from an account with no games — and not something a read can fix.
			this.logger.debug(`No account row for ${puuid}; serving no match ids`);
			return [];
		}

		return this.accountMatches.listMatchIds(account.id, request);
	}
}
