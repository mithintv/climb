import {
	BadRequestException,
	Controller,
	Get,
	Logger,
	Param,
	Query,
} from "@nestjs/common";

import type { AccountRow } from "./../../core/database/types/account-row.type.ts";
import { RiotApiService } from "./../../integrations/riot/riot-api.service.ts";
import { splitMatchId } from "./../../lib/split-match-id.ts";
import { AccountService } from "./account.service.ts";
import { AccountMatchService } from "./account-matches/account-match.service.ts";

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
	private readonly riot: RiotApiService;

	constructor(
		accounts: AccountService,
		accountMatches: AccountMatchService,
		riot: RiotApiService,
	) {
		this.accounts = accounts;
		this.accountMatches = accountMatches;
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
	 * `GET /accounts/:puuid/matches?before=&start=&count=` — a page of the
	 * account's match ids, newest first.
	 *
	 * `before` is a match id and the cursor form; it is what a client paging
	 * through a history should send, because `start` counts from a head that
	 * moves as games finish. `start` still works, and the response is a plain
	 * array of ids either way.
	 */
	@Get(":puuid/matches")
	async getMatchIds(
		@Param("puuid") puuid: string,
		@Query("start") start?: string,
		@Query("count") count?: string,
		@Query("before") before?: string,
	) {
		const startIndex = Number(start) || 0;
		const pageSize = Number(count) || 5;

		const matchIds = await this.accountMatches.getMatchIds(puuid, {
			beforeGameId: parseCursor(before),
			start: startIndex,
			count: pageSize,
		});
		this.logger.debug(
			`Served ${matchIds.length} match ids (before=${before ?? "-"}, start=${startIndex}, count=${pageSize})`,
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
const parseCursor = (before: string | undefined) => {
	if (!before) return undefined;
	try {
		return splitMatchId(before).gameId;
	} catch {
		throw new BadRequestException(`Not a match id: ${before}`);
	}
};
