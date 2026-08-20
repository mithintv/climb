import type { SummonerInsightIcon } from "./summoner-insight-icon.type";

/** One coaching line on the rail: what it is about, and what it says. */
export interface ISummonerInsight {
	/** Which subject the line is about, which picks its glyph and colour. */
	icon: SummonerInsightIcon;
	/** One or two sentences, phrased as an observation rather than an order. */
	text: string;
}
