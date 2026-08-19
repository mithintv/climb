import { Injectable } from "@nestjs/common";
import axios from "axios";

import { RIOT_PLATFORM_HOST, RIOT_REGIONAL_HOST } from "./riot-api.constant.ts";
import type { IRiotAccount } from "./types/i-riot-account.type.ts";
import type { IRiotLeagueEntry } from "./types/i-riot-league-entry.type.ts";

/** The Riot API client. Holds no policy: no caching, no fallbacks, no retries. */
@Injectable()
export class RiotApiService {
	private headers() {
		return { "X-Riot-Token": process.env.X_RIOT_TOKEN };
	}

	/**
	 * Resolves a riot id to an account. Returns Riot's casing of the name, not the
	 * caller's, so the cached row records what the account is actually called.
	 */
	async fetchAccount(
		gameName: string,
		tagLine: string = "NA1",
	): Promise<IRiotAccount> {
		const account = await axios.get(
			`${RIOT_REGIONAL_HOST}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
			{ headers: this.headers() },
		);
		return account.data;
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
		const matches = await axios.get(
			`${RIOT_REGIONAL_HOST}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=${start}&count=${count}${queueParam}`,
			{ headers: this.headers() },
		);
		return matches.data;
	}

	/** Every ranked queue the player has a standing in. A fresh account has none. */
	async fetchLeagueEntries(puuid: string): Promise<IRiotLeagueEntry[]> {
		const entries = await axios.get(
			`${RIOT_PLATFORM_HOST}/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
			{ headers: this.headers() },
		);
		return entries.data;
	}

	/** One full match-v5 payload. */
	async fetchMatch(matchId: string) {
		const match = await axios.get(
			`${RIOT_REGIONAL_HOST}/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
			{ headers: this.headers() },
		);
		return match.data;
	}
}
