/**
 * Creep score as a rate.
 *
 * Riot reports `gameDuration` in seconds. A remake can report it as zero, which
 * would make the rate infinite, so a game with no duration is zero rather than
 * a figure that swamps whatever it is averaged into.
 */
export const csPerMinute = (totalCs: number, gameDuration: number) =>
	gameDuration > 0 ? totalCs / (gameDuration / 60) : 0;
