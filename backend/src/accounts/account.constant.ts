/**
 * How long a cached riot id → puuid answer is trusted before the account API is
 * asked again. The name itself drifting is harmless; the reason for a TTL at all
 * is that a riot id released by a rename can be claimed by a different account,
 * so a stale row can name the wrong player.
 */
export const RIOT_ID_TTL_MS = 24 * 60 * 60 * 1000;
