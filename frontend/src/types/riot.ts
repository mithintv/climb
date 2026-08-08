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
	championId: number;
	championName: string;
	win: boolean;
	kills: number;
	deaths: number;
	assists: number;
	goldEarned: number;
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
	perks: { styles: PerkStyle[] };
}

export interface MatchDto {
	info: {
		gameCreation: number;
		gameDuration: number;
		gameStartTimestamp: number;
		gameEndTimestamp: number;
		gameId: number;
		gameMode: string;
		gameVersion: string;
		mapId: number;
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
