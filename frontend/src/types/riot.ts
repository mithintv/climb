export interface PerkStyle {
	style: number;
	selections: { perk: number }[];
}

export interface MatchParticipant {
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
		styles: PerkStyle[];
		/**
		 * The three stat shards, as rune ids. An id of 0 means no shard — seen on
		 * some older matches — so callers must skip it.
		 */
		statPerks: { offense: number; flex: number; defense: number };
	};
}

export interface MatchDto {
	metadata: {
		/** "NA1_5607525822"; the id the match was fetched by. */
		matchId: string;
		dataVersion: string;
		/** The participants' puuids, in the same order as info.participants. */
		participants: string[];
	};
	info: {
		gameCreation: number;
		gameDuration: number;
		gameStartTimestamp: number;
		gameEndTimestamp: number;
		gameId: number;
		gameMode: string;
		gameVersion: string;
		mapId: number;
		/** 420 ranked solo, 450 ARAM, … ; see queue.constant.ts. */
		queueId: number;
		participants: MatchParticipant[];
	};
}

export interface MatchNotes {
	champion_knowledge: string[];
}

export interface GameInfo {
	gameCreation: number;
	gameDuration: number;
	gameStartTimestamp: number;
	gameEndTimestamp: number;
	gameId: number;
	gameMode: string;
	gameVersion: string;
	mapId: number;
	queueId: number;
}

export type MatchState =
	| {
			data: false;
			player: null;
			game: null;
			team100: MatchParticipant[];
			team200: MatchParticipant[];
			notes: MatchNotes | null;
	  }
	| {
			data: true;
			player: MatchParticipant;
			game: GameInfo;
			team100: MatchParticipant[];
			team200: MatchParticipant[];
			notes: MatchNotes | null;
	  };

/** One league-v4 entry: a player's standing in a single ranked queue. */
export interface LeagueEntry {
	/** "RANKED_SOLO_5x5", "RANKED_FLEX_SR", and occasional novelty queues. */
	queueType: string;
	/** "IRON" … "CHALLENGER". */
	tier: string;
	/** "IV" … "I". Always "I" for Master and above, which have no divisions. */
	rank: string;
	leaguePoints: number;
	wins: number;
	losses: number;
}
