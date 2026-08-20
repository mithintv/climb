import { Controller, Get, Header, Logger, Param } from "@nestjs/common";

import { MatchService } from "./match.service.ts";

@Controller("matches")
export class MatchController {
	private readonly logger = new Logger(MatchController.name);
	private readonly matches: MatchService;

	constructor(matches: MatchService) {
		this.matches = matches;
	}

	/**
	 * `GET /matches/:matchId` — one full match payload. The first request saves
	 * it; every later one reads it back out of the database.
	 *
	 * A player's list of match ids is not here: it belongs to an account rather
	 * than to the match collection, and is served by `GET /accounts/:puuid/matches`.
	 *
	 * The body is passed through as the characters Riot sent rather than
	 * re-serialised, so the header has to be set by hand: Nest sends a string
	 * response as `text/html` otherwise, and a caller would have to parse a
	 * payload the content type says is markup.
	 */
	@Get(":matchId")
	@Header("Content-Type", "application/json")
	async getMatch(@Param("matchId") matchId: string) {
		const { body, source } = await this.matches.getMatchBody(matchId);
		this.logger.debug(`Served match ${matchId} from ${source}`);
		return body;
	}
}
