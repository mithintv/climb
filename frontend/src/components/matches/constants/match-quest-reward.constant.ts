/**
 * Names for the dedicated lane quest reward items, so the icon has a tooltip
 * without bundling the 715 KB `item.json` for fifteen ids.
 *
 * Only top, jungle, mid and support have items of their own. Bot lane's reward
 * is a pair of boots and support sometimes earns a Control Ward, so
 * `roleBoundItem` also carries ordinary item ids — those fall back to the
 * generic label rather than being listed here and going stale every patch.
 */
export const MATCH_QUEST_REWARD_NAMES: Record<number, string> = {
	1206: "Mid Lane Quest Reward",
	1208: "Support Quest Reward",
	1209: "Jungle Quest Reward",
	1220: "Unleashed Teleport (Top Lane Quest Reward)",
	1221: "Top Lane Quest Reward",
};

/** Shown for a reward that is an ordinary item, such as bot lane's boots. */
export const MATCH_QUEST_REWARD_FALLBACK = "Lane quest reward";
