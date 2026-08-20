/**
 * The three ways a participant's perk row can have been chosen, which is what
 * decides how to read its `slot`.
 *
 * They are kept apart because they are picked differently, not because they are
 * different kinds of thing — all three are plain perk ids in the payload.
 *
 * - `PRIMARY` — four picks from the primary tree; slot 0 is the keystone.
 * - `SECONDARY` — two picks from the secondary tree, which has no keystone.
 * - `STAT` — the three stat shards, in Riot's own `offense`, `flex`, `defense`
 *   order as slots 0, 1 and 2. These have no tree, which is why `style_id` is
 *   nullable.
 */
export const PERK_KINDS = ["PRIMARY", "SECONDARY", "STAT"] as const;

/** One of `PERK_KINDS`. */
export type PerkKind = (typeof PERK_KINDS)[number];
