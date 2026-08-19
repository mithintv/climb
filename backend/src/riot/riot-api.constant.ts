/**
 * Riot routes account and match-v5 calls through a super-region rather than a
 * platform. Every account this app serves is on NA1 today, so this is hardcoded;
 * it is stored on each cached account so a second region can be added without
 * guessing which host resolved an existing row.
 */
export const RIOT_ROUTING_REGION = "americas";

/** Base URL for the regional endpoints, derived from the routing region. */
export const RIOT_REGIONAL_HOST = `https://${RIOT_ROUTING_REGION}.api.riotgames.com`;

/**
 * league-v4 is a platform endpoint, not a regional one — it answers on na1 and
 * not on americas, so it needs its own host.
 */
export const RIOT_PLATFORM = "na1";

/** Base URL for the platform endpoints. */
export const RIOT_PLATFORM_HOST = `https://${RIOT_PLATFORM}.api.riotgames.com`;
