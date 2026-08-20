import { bigint, boolean, integer, pgTable } from "drizzle-orm/pg-core";

import { accounts } from "./accounts.model.ts";

/**
 * How far one account's entry in `account_matches` has been synced, one row per
 * account.
 *
 * Separate from `accounts` because it is bookkeeping for this feature, not part
 * of what an account is, and because it is written on a completely different
 * cadence — every id-list read touches it, while an account row is refreshed
 * once a day.
 *
 * The DDL is generated from this file by `pnpm --filter backend db:generate`.
 */
export const accountMatchSync = pgTable("account_match_sync", {
	/**
	 * Also the primary key: the row *is* the account's sync state, so there is
	 * nothing to have a second one of.
	 */
	accountId: integer("account_id")
		.primaryKey()
		.references(() => accounts.id),
	/**
	 * Epoch ms the newest end of Riot's list was last read. 0 on a row that has
	 * never synced, which is what makes the TTL check fire on the first request
	 * without a null branch beside it.
	 */
	headSyncedAt: bigint("head_synced_at", { mode: "number" })
		.notNull()
		.default(0),
	/**
	 * The lowest `game_id` held for this account, or null while it holds none.
	 * Recomputed from `account_matches` rather than tracked, so it cannot drift.
	 */
	oldestGameId: bigint("oldest_game_id", { mode: "number" }),
	/**
	 * How many ids are held, which doubles as the offset the next backfill page
	 * starts from — Riot's `start` is a position in the same list. Recomputed
	 * from `account_matches` for that reason: an offset that has drifted from the
	 * row count would silently skip games.
	 */
	syncedCount: integer("synced_count").notNull().default(0),
	/**
	 * Set once Riot returns fewer ids than a backfill page asked for, meaning the
	 * oldest end of the list has been reached. It stops every later Riot call for
	 * a window the index cannot fill, since there is nothing left to fill it with.
	 */
	backfillComplete: boolean("backfill_complete").notNull().default(false),
});
