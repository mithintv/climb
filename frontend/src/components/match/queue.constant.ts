/**
 * Queue ids the app is likely to show, mapped to the name a player would use.
 * Riot's full list is ~60 entries of mostly retired rotating modes; anything
 * missing falls back to the payload's `gameMode`, so this only has to cover what
 * is actually queueable today.
 */
export const QUEUE_NAMES: Record<number, string> = {
	400: "Normal Draft",
	420: "Ranked Solo",
	430: "Normal Blind",
	440: "Ranked Flex",
	450: "ARAM",
	490: "Quickplay",
	700: "Clash",
	720: "ARAM Clash",
	830: "Co-op vs AI",
	840: "Co-op vs AI",
	850: "Co-op vs AI",
	900: "ARURF",
	1020: "One for All",
	1300: "Nexus Blitz",
	1400: "Ultimate Spellbook",
	1700: "Arena",
	1900: "URF",
};

/** Title-cases the raw `gameMode` (`"CLASSIC"` → `"Classic"`) for the fallback. */
export const formatGameMode = (gameMode: string) =>
	gameMode.charAt(0) + gameMode.slice(1).toLowerCase();
