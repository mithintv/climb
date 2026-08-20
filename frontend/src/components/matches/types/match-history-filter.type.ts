/**
 * The queue filters above the match list, and the queue ids each one keeps.
 *
 * `queueIds: null` means "do not filter" rather than "no queues" — an empty
 * array would be a filter that matches nothing, which is a different thing and
 * an easy one to write by accident.
 *
 * ARAM covers its Clash variant too: they are the same mode to anyone reading
 * their history, and splitting them would leave a filter that is empty for
 * almost every account.
 */
export const MATCH_HISTORY_FILTERS = [
	{ id: "all", label: "ALL", queueIds: null },
	{ id: "solo", label: "SOLO/DUO", queueIds: [420] },
	{ id: "flex", label: "FLEX", queueIds: [440] },
	{ id: "aram", label: "ARAM", queueIds: [450, 720] },
] as const;

/** Which queue filter is applied to the list. */
export type MatchHistoryFilter = (typeof MATCH_HISTORY_FILTERS)[number]["id"];
