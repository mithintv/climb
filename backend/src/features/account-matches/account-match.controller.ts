import {
	BadRequestException,
	Controller,
	Get,
	Logger,
	Param,
	Query,
} from "@nestjs/common";

import { splitMatchId } from "./../../lib/split-match-id.ts";
import { AccountMatchService } from "./account-match.service.ts";

/**
 * Declares the `accounts` prefix although it lives outside the accounts
 * feature: the ids are a collection belonging to one account, so the URL nests
 * under it, while the code that serves them is a match index and belongs beside
 * the tables it maintains. Nest binds routes by decorator, not by directory,
 * so the two do not have to agree.
 */
@Controller("accounts")
export class AccountMatchController {
	private readonly logger = new Logger(AccountMatchController.name);
	private readonly accountMatches: AccountMatchService;

	constructor(accountMatches: AccountMatchService) {
		this.accountMatches = accountMatches;
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
