/** An account-v1 response: the puuid plus the riot id it currently resolves to. */
export interface IRiotAccount {
	puuid: string;
	/** Riot's own casing, which may differ from what the caller typed. */
	gameName: string;
	/** "NA1", without a leading '#'. */
	tagLine: string;
}
