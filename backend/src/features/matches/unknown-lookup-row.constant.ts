/**
 * What is recorded when a payload does not say which queue, map, mode, type or
 * patch a match was played on.
 *
 * Those five columns on `matches` are `NOT NULL`, so every match must resolve to
 * a row. Riot drops and reshapes fields between patches, and losing a whole
 * payload to a missing `gameMode` would defeat the point of storing the blob —
 * so an unreadable value lands on one of these instead of failing the insert.
 *
 * Every value here is one Riot cannot itself send: its mode and type tokens
 * name real things, its queue and map ids are non-negative, and its patch
 * numbering starts at 1. A row pointing here means "the payload did not say",
 * and the blob is still there to re-project once the extractors learn the new
 * shape.
 */

/** Stands in for `info.queueId`. Riot's own ids are non-negative, 0 being customs. */
export const UNKNOWN_QUEUE_ID = -1;

/** Stands in for `info.mapId`. */
export const UNKNOWN_MAP_ID = -1;

/** Stands in for `info.gameMode` when the payload carries none. */
export const UNKNOWN_GAME_MODE = "UNKNOWN";

/** Stands in for `info.gameType` when the payload carries none. */
export const UNKNOWN_GAME_TYPE = "UNKNOWN";

/** Stands in for `info.gameVersion` when it is absent or unparseable. */
export const UNKNOWN_PATCH = { major: 0, minor: 0 };
