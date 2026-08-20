import { Injectable, Logger } from "@nestjs/common";

import { RiotApiService } from "./../../integrations/riot/riot-api.service.ts";
import { MatchRepository } from "./match.repository.ts";
import { decodeMatchPayload } from "./match-payload.utils.ts";
import type { IRiotMatchDto } from "./types/i-riot-match-dto.type.ts";

/**
 * Saves match payloads, and serves them from the database once saved.
 *
 * Not a cache: nothing here expires, is evicted or is revalidated. A completed
 * match never changes, so the first fetch is the last one and the saved row is
 * the record rather than a copy of one.
 */
@Injectable()
export class MatchService {
	private readonly logger = new Logger(MatchService.name);
	private readonly matches: MatchRepository;
	private readonly riot: RiotApiService;

	constructor(matches: MatchRepository, riot: RiotApiService) {
		this.matches = matches;
		this.riot = riot;
	}

	/**
	 * The match payload, read from the database when it has been saved and
	 * fetched from Riot — and saved — when it has not.
	 *
	 * `source` says which happened. It is reported rather than inferred because
	 * the body is identical either way: the same characters Riot sent are
	 * returned on both paths, so nothing else can tell them apart.
	 *
	 * `now` is a parameter rather than a `Date.now()` call so `fetched_at` is
	 * assertable in a test.
	 */
	async getMatchBody(
		matchId: string,
		now: number = Date.now(),
	): Promise<{ body: string; source: "database" | "riot" }> {
		const saved = await this.matches.findPayload(matchId);
		if (saved) {
			return {
				body: decodeMatchPayload(saved.payload, saved.payloadEncoding),
				source: "database",
			};
		}

		const body = await this.riot.fetchMatchBody(matchId);
		const dto = JSON.parse(body) as IRiotMatchDto;
		const { stored } = await this.matches.ingest({
			matchId,
			body,
			dto,
			fetchedAt: now,
		});
		if (!stored) {
			this.logger.debug(
				`Lost the ingest race for ${matchId}; row already there`,
			);
		}

		return { body, source: "riot" };
	}
}
