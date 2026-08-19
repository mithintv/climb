import { useEffect, useState } from "react";

import type { LeagueEntry, MatchDto } from "@/types/riot";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3080";

/** How many matches the profile loads on first paint. */
const MATCH_COUNT = 10;

interface IAccount {
	puuid: string;
	gameName: string;
	tagLine: string;
}

export interface ISummonerData {
	account: IAccount | null;
	ranks: LeagueEntry[];
	/** Full payloads, not ids — the champion stats aggregate over them. */
	matches: MatchDto[];
	loading: boolean;
	error: string | null;
}

const getJson = async (path: string) => {
	const response = await fetch(`${backendUrl}${path}`);
	if (!response.ok) {
		throw new Error(`${response.status} from ${path}`);
	}
	return response.json();
};

/**
 * Loads everything a profile page shows. The match payloads are fetched here
 * rather than inside each card so the champion stats have something to
 * aggregate — one request per match either way, but the page owns the data.
 */
export const useSummoner = (gameName: string, tagLine: string) => {
	const [data, setData] = useState<ISummonerData>({
		account: null,
		ranks: [],
		matches: [],
		loading: true,
		error: null,
	});

	useEffect(() => {
		// Guards against a slow response for a previous riot id landing after the
		// user has already searched for another.
		let active = true;

		const load = async () => {
			setData({
				account: null,
				ranks: [],
				matches: [],
				loading: true,
				error: null,
			});

			try {
				const account: IAccount = await getJson(
					`/accounts?riotId=${encodeURIComponent(`${gameName}#${tagLine}`)}`,
				);
				if (!active) return;
				setData((previous) => ({ ...previous, account }));

				const [ranks, matchIds] = await Promise.all([
					getJson(`/accounts/${account.puuid}/rank`) as Promise<LeagueEntry[]>,
					getJson(
						`/matches?puuid=${account.puuid}&start=0&count=${MATCH_COUNT}`,
					) as Promise<string[]>,
				]);
				if (!active) return;
				setData((previous) => ({ ...previous, ranks }));

				const matches = await Promise.all(
					matchIds.map((id) => getJson(`/matches/${id}`) as Promise<MatchDto>),
				);
				if (!active) return;

				setData({
					account,
					ranks,
					matches,
					loading: false,
					error: null,
				});
			} catch (error) {
				if (!active) return;
				console.error("Failed to load summoner", { gameName, tagLine, error });
				setData({
					account: null,
					ranks: [],
					matches: [],
					loading: false,
					error:
						error instanceof Error && error.message.startsWith("404")
							? "No summoner with that riot id."
							: "Could not load this summoner. Try again in a moment.",
				});
			}
		};

		load();
		return () => {
			active = false;
		};
	}, [gameName, tagLine]);

	return data;
};
