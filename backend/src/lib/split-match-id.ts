/**
 * Splits a match id into the platform and game id it is built from.
 *
 * The id is `platform_id + "_" + game_id` in every sampled payload, so this is
 * the authoritative source for both — more so than `info.platformId`, which the
 * caller has no way to have asked for, and which the id index never sees at all
 * because it holds ids whose payloads have not been fetched.
 *
 * The game id is a safe integer and monotonic per platform, which is what lets
 * the index sort by recency before a single payload exists.
 *
 * A `matchId` in some other shape is a caller error rather than a Riot one, so
 * this one does throw.
 */
export const splitMatchId = (matchId: string) => {
	const separator = matchId.indexOf("_");
	const raw = matchId.slice(separator + 1);
	const gameId = Number(raw);
	// The digit test is not redundant: `Number("")` is 0, which is a safe
	// integer, so "NA1_" would otherwise parse as game 0 and page from a
	// position no match occupies rather than being refused.
	if (separator <= 0 || !/^\d+$/.test(raw) || !Number.isSafeInteger(gameId)) {
		throw new Error(`Not a match id: ${matchId}`);
	}
	return { platformId: matchId.slice(0, separator), gameId };
};
