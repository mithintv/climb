/** One entry of the stat rail: a display label over a set of asset tags. */
export interface IStatFilter {
	/** Stable key; this is what travels in the URL. */
	key: string;
	label: string;
	/** The Data Dragon tags this stat collects. */
	tags: string[];
}
