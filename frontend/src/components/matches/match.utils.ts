/** Formatting helpers for one match card. */

/** `1714` → `"28:34"`. Riot reports `gameDuration` in seconds. */
export const formatDuration = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remainder = Math.floor(seconds % 60);
	return `${minutes}:${remainder.toString().padStart(2, "0")}`;
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * A short "when did I play this" label. Deliberately coarse — the exact
 * timestamp is noise on a list you scan, so anything past a month reads as
 * weeks and anything past a year as months.
 */
export const formatRelativeTime = (timestamp: number, now = Date.now()) => {
	const elapsed = Math.max(0, now - timestamp);
	if (elapsed < HOUR) {
		const minutes = Math.floor(elapsed / MINUTE);
		return minutes <= 1 ? "just now" : `${minutes}m ago`;
	}
	if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
	if (elapsed < 30 * DAY) return `${Math.floor(elapsed / DAY)}d ago`;
	if (elapsed < 365 * DAY) return `${Math.floor(elapsed / (7 * DAY))}w ago`;
	return `${Math.floor(elapsed / (30 * DAY))}mo ago`;
};

/**
 * (kills + assists) / deaths, or `null` when nobody died — dividing by zero
 * renders `Infinity`, which is what the previous card did on a deathless game.
 * Callers show "Perfect" for the null case.
 */
export const kdaRatio = (kills: number, deaths: number, assists: number) =>
	deaths === 0 ? null : (kills + assists) / deaths;

/** `14231` → `"14.2k"`, so gold stays one glanceable width. */
export const formatGold = (gold: number) =>
	gold >= 1000 ? `${(gold / 1000).toFixed(1)}k` : `${gold}`;

/**
 * `"18 AUG"` — the calendar date, beside the relative one rather than instead
 * of it. "3d ago" is what a reader scans by; the date is what they need the
 * moment they want to line a game up against something outside the app.
 *
 * No year: the list is in reverse chronological order, so a game old enough for
 * the year to matter is far past where anyone is still reading dates.
 */
export const formatMatchDate = (timestamp: number) =>
	new Date(timestamp)
		.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
		.toUpperCase();
