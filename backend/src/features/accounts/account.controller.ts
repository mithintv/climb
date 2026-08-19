import {
	BadRequestException,
	Controller,
	Get,
	Logger,
	Param,
	Query,
} from "@nestjs/common";

import type { IAccountRow } from "./../../core/database/schema.ts";
import { RiotApiService } from "./../../integrations/riot/riot-api.service.ts";
import { AccountService } from "./account.service.ts";

/** The response shape for an account, in the API's own casing. */
const toResponse = (account: IAccountRow) => ({
	puuid: account.puuid,
	gameName: account.gameName,
	tagLine: account.tagLine,
});

@Controller("accounts")
export class AccountController {
	private readonly logger = new Logger(AccountController.name);
	private readonly accounts: AccountService;
	private readonly riot: RiotApiService;

	constructor(accounts: AccountService, riot: RiotApiService) {
		this.accounts = accounts;
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
}
