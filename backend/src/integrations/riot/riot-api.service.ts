import { Injectable } from "@nestjs/common";

import { HttpClientService } from "./../../core/http/http-client.service.ts";
import { RIOT_PLATFORM_HOST, RIOT_REGIONAL_HOST } from "./riot-api.constant.ts";
import type { IRiotAccount } from "./types/i-riot-account.type.ts";
import type { IRiotLeagueEntry } from "./types/i-riot-league-entry.type.ts";

/**
 * The Riot API client. Holds no policy: no caching, no fallbacks, no retries.
 * Failures are translated by `HttpClientService`, so nothing here catches.
 */
@Injectable()
export class RiotApiService {
	private readonly http: HttpClientService;

	constructor(http: HttpClientService) {
		this.http = http;
	}

	/** Every Riot request carries the API key; nothing else is shared. */
	private get config() {
		return { headers: { "X-Riot-Token": process.env.X_RIOT_TOKEN } };
	}

	/**
	 * Resolves a riot id to an account. Returns Riot's casing of the name, not the
	 * caller's, so the cached row records what the account is actually called.
	 */
	async fetchAccount(
		gameName: string,
		tagLine: string = "NA1",
	): Promise<IRiotAccount> {
		return this.http.get<IRiotAccount>(
			`${RIOT_REGIONAL_HOST}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
			this.config,
		);
	}

	/**
	 * A page of a player's match ids, newest first. Pass a queue id to page only
	 * that queue, which is how the LP tracker isolates ranked solo games.
	 */
	async fetchMatchIds(
		puuid: string,
		start: number = 0,
		count: number = 5,
		queue?: number,
	): Promise<string[]> {
		const queueParam = queue === undefined ? "" : `&queue=${queue}`;
		return this.http.get<string[]>(
			`${RIOT_REGIONAL_HOST}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=${start}&count=${count}${queueParam}`,
			this.config,
		);
	}

	/** Every ranked queue the player has a standing in. A fresh account has none. */
	async fetchLeagueEntries(puuid: string): Promise<IRiotLeagueEntry[]> {
		return this.http.get<IRiotLeagueEntry[]>(
			`${RIOT_PLATFORM_HOST}/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
			this.config,
		);
	}

	/**
	 * One full match-v5 payload, as the characters Riot sent rather than a parsed
	 * object. A completed match is saved whole and byte-exact, and only what is
	 * stored unparsed can be returned unchanged; callers that need the fields
	 * parse it themselves.
	 */
	async fetchMatchBody(matchId: string): Promise<string> {
		return this.http.getText(
			`${RIOT_REGIONAL_HOST}/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
			this.config,
		);
	}
}
