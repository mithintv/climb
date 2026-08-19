import type { IMatchParticipant } from "./i-match-participant.type";

/** A match-v5 match, as Riot returns it. */
export interface IMatch {
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
		participants: IMatchParticipant[];
	};
}
