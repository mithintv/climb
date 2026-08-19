/**
 * A match-v5 payload as Riot sends it, described only as far as the projection
 * reads it.
 *
 * Every field is optional on purpose. Measured over 16 real payloads,
 * participants carry 156 distinct keys and the set is not stable between
 * patches: `bountyLevel` was dropped from 130 of 178 sampled participants and
 * `roleBoundItem` was added to 100 of them. Declaring anything required here
 * would turn a Riot patch into a crash on ingest — the stored blob is the
 * contract, and this type only guides the columns projected off it.
 *
 * It is named after its source rather than the domain: this is Riot's wire
 * shape, not the app's, and the two must be free to differ.
 */
export interface IRiotMatchDto {
	metadata?: {
		matchId?: string;
		dataVersion?: string;
		/**
		 * Byte-identical to `info.participants[].puuid` in the same order on every
		 * sampled payload, which is why it is not projected into a column.
		 */
		participants?: string[];
	};
	info?: {
		/** "NA1". Also the part of the match id before the underscore. */
		platformId?: string;
		gameId?: number;
		gameCreation?: number;
		/** Seconds on modern patches, despite the ms-shaped siblings. */
		gameDuration?: number;
		gameStartTimestamp?: number;
		gameEndTimestamp?: number;
		gameMode?: string;
		gameType?: string;
		gameVersion?: string;
		mapId?: number;
		queueId?: number;
		/** "GameComplete" or "Abort_Unexpected". Absent on older matches. */
		endOfGameResult?: string;
		participants?: {
			puuid?: string;
			riotIdGameName?: string;
			riotIdTagline?: string;
			teamId?: number;
			teamPosition?: string;
			championId?: number;
			championName?: string;
			win?: boolean;
			kills?: number;
			deaths?: number;
			assists?: number;
			goldEarned?: number;
			totalMinionsKilled?: number;
			neutralMinionsKilled?: number;
			summoner1Id?: number;
			summoner2Id?: number;
			item0?: number;
			item1?: number;
			item2?: number;
			item3?: number;
			item4?: number;
			item5?: number;
			item6?: number;
			/** Arena finishing position, 1-8. Reported as 0, not omitted, elsewhere. */
			placement?: number;
			perks?: {
				styles?: {
					/** "primaryStyle" or "subStyle"; the projection prefers it to order. */
					description?: string;
					style?: number;
					selections?: { perk?: number }[];
				}[];
			};
		}[];
	};
}
