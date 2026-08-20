import type { ISummonerInsight } from "./types/i-summoner-insight.type";

/**
 * Stand-in coaching lines. **These are not about the player on screen** — they
 * are the design prototype's copy, shown verbatim for every account.
 *
 * Each one describes analysis that does not exist: a deaths-by-minute
 * distribution, CS rate split around the first item completion, and win rate
 * conditioned on early ward count. All three need per-timestamp match data
 * (Riot's match timeline endpoint), which the backend neither fetches nor
 * stores.
 *
 * The section is built anyway so the rail has its third block and the shape of
 * the feature is visible. Nothing here should ship to real users as-is.
 */
export const SUMMONER_INSIGHTS_PLACEHOLDER: ISummonerInsight[] = [
	{
		icon: "deaths",
		text: "Deaths spike between 14–20 min. You roam without vision on both side lanes.",
	},
	{
		icon: "farming",
		text: "CS drops 1.4/min after your first item — recall timings are late.",
	},
	{
		icon: "vision",
		text: "You win 78% of games with 4+ wards placed before 10 min.",
	},
];
