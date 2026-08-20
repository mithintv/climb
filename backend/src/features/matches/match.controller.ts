import {
	Controller,
	Get,
	Header,
	Logger,
	NotFoundException,
	Param,
} from "@nestjs/common";

import { MatchService } from "./match.service.ts";

@Controller("matches")
export class MatchController {
	private readonly logger = new Logger(MatchController.name);
	private readonly matches: MatchService;

	constructor(matches: MatchService) {
		this.matches = matches;
	}

	/**
	 * `GET /matches/:matchId` — one saved match payload.
	 *
	 * A database read: a match nothing has synced is a 404 rather than a fetch.
	 * This is the call a scrolling client makes once per card, and a Riot fetch
	 * behind it would mean reading a history at Riot's expense and Riot's speed.
	 * `POST /accounts/:puuid/sync` is what puts payloads here.
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
		const body = await this.matches.findMatchBody(matchId);
		if (!body) {
			throw new NotFoundException(`Match ${matchId} has not been synced`);
		}
		this.logger.debug(`Served match ${matchId} from the database`);
		return body;
	}
}
