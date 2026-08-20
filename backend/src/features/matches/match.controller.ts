import {
	BadRequestException,
	Controller,
	Get,
	Header,
	Logger,
	Param,
	Query,
} from "@nestjs/common";

import { RiotApiService } from "./../../integrations/riot/riot-api.service.ts";
import { MatchService } from "./match.service.ts";

@Controller("matches")
export class MatchController {
	private readonly logger = new Logger(MatchController.name);
	private readonly matches: MatchService;
	private readonly riot: RiotApiService;

	constructor(matches: MatchService, riot: RiotApiService) {
		this.matches = matches;
		this.riot = riot;
	}

	/**
	 * `GET /matches?puuid=…&start=&count=` — a page of a player's match ids,
	 * newest first. The puuid is a filter on the collection rather than a path
	 * segment, since the ids belong to matches, not to the player.
	 */
	@Get()
	async getMatchIds(
		@Query("puuid") puuid?: string,
		@Query("start") start?: string,
		@Query("count") count?: string,
	) {
		if (!puuid) {
			throw new BadRequestException("A puuid query parameter is required");
		}

		const startIndex = Number(start) || 0;
		const pageSize = Number(count) || 5;

		const matchIds = await this.riot.fetchMatchIds(puuid, startIndex, pageSize);
		this.logger.debug(
			`Fetched ${matchIds.length} match ids (start=${startIndex}, count=${pageSize})`,
		);
		return matchIds;
	}

	/**
	 * `GET /matches/:matchId` — one full match payload. The first request saves
	 * it; every later one reads it back out of the database.
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
