import { Injectable } from "@nestjs/common";

import type { AccountRow } from "./../../core/database/types/account-row.type.ts";
import { RIOT_ROUTING_REGION } from "./../../integrations/riot/riot-api.constant.ts";
import { RiotApiService } from "./../../integrations/riot/riot-api.service.ts";
import { RIOT_ID_TTL_MS } from "./account.constant.ts";
import { AccountRepository } from "./account.repository.ts";

/** True while a cached riot id is young enough to answer without asking Riot. */
export const isRiotIdFresh = (checkedAt: number, now: number) =>
	now - checkedAt < RIOT_ID_TTL_MS;

/** Read-through cache over the Riot account API. */
@Injectable()
export class AccountService {
	private readonly accounts: AccountRepository;
	private readonly riot: RiotApiService;

	constructor(accounts: AccountRepository, riot: RiotApiService) {
		this.accounts = accounts;
		this.riot = riot;
	}

	/**
	 * Resolves a riot id to a cached account, calling account-v1 only when there
	 * is no row or its riot id has aged past the TTL.
	 *
	 * `now` is a parameter rather than a `Date.now()` call so the TTL boundary is
	 * testable without waiting a day.
	 */
	async resolveByRiotId(
		gameName: string,
		tagLine: string,
		now: number = Date.now(),
	): Promise<{ account: AccountRow; cached: boolean }> {
		const cached = await this.accounts.findByRiotId(gameName, tagLine);
		if (cached && isRiotIdFresh(cached.riotIdCheckedAt, now)) {
			return { account: cached, cached: true };
		}

		const fetched = await this.riot.fetchAccount(gameName, tagLine);
		const account = await this.accounts.upsert(
			{ ...fetched, region: RIOT_ROUTING_REGION },
			now,
		);
		return { account, cached: false };
	}
}
