import {
	BadRequestException,
	Controller,
	Get,
	Logger,
	Param,
	Query,
} from "@nestjs/common";

import { RiotApiService } from "./../riot/riot-api.service.ts";

@Controller("matches")
export class MatchController {
	private readonly logger = new Logger(MatchController.name);
	private readonly riot: RiotApiService;

	constructor(riot: RiotApiService) {
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

	/** `GET /matches/:matchId` — one full match payload. */
	@Get(":matchId")
	async getMatch(@Param("matchId") matchId: string) {
		const match = await this.riot.fetchMatch(matchId);
		this.logger.debug(`Fetched match data for ${matchId}`);
		return match;
	}
}
