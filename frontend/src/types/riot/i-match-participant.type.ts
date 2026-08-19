import type { IPerkStyle } from "./i-perk-style.type";

/** One player's line in a match-v5 payload. */
export interface IMatchParticipant {
	puuid: string;
	summonerId: string;
	summonerName: string;
	teamId: number;
	teamPosition: string;
	/** Riot emptied `summonerName`; these carry the live riot id. */
	riotIdGameName: string;
	riotIdTagline: string;
	champLevel: number;
	championId: number;
	championName: string;
	win: boolean;
	kills: number;
	deaths: number;
	assists: number;
	goldEarned: number;
	visionScore: number;
	challenges: { goldPerMinute: number };
	totalMinionsKilled: number;
	neutralMinionsKilled: number;
	summoner1Id: number;
	summoner2Id: number;
	item0: number;
	item1: number;
	item2: number;
	item3: number;
	item4: number;
	item5: number;
	item6: number;
	/**
	 * The lane quest reward this role earned. Added in patch 16.12 — absent on
	 * older matches and on Arena, so it is optional.
	 */
	roleBoundItem?: number | null;
	perks: {
		styles: IPerkStyle[];
		/**
		 * The three stat shards, as rune ids. An id of 0 means no shard — seen on
		 * some older matches — so callers must skip it.
		 */
		statPerks: { offense: number; flex: number; defense: number };
	};
}
