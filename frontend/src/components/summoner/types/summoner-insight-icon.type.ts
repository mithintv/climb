/**
 * The glyphs an insight can lead with, one per subject the coaching notes talk
 * about. A closed list rather than a free component reference so an insight is
 * plain data — the day these come from an endpoint, the payload can name one of
 * these and the frontend still owns what it looks like.
 */
export const SUMMONER_INSIGHT_ICONS = ["deaths", "farming", "vision"] as const;

/** One of the three subjects an insight can be about. */
export type SummonerInsightIcon = (typeof SUMMONER_INSIGHT_ICONS)[number];
