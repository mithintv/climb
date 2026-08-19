import { sql } from "drizzle-orm";
import { bigint, index, pgTable, serial, text } from "drizzle-orm/pg-core";

/**
 * A Riot account, cached so a riot id can be resolved to a puuid without an
 * account-v1 call every time.
 *
 * The DDL is generated from this file by `pnpm --filter backend db:generate`,
 * and `../types/account-row.type.ts` infers the row type off it, so there is
 * nothing to keep in sync by hand.
 */
export const accounts = pgTable(
	"accounts",
	{
		id: serial("id").primaryKey(),
		/** The only stable identity: riot ids are renameable, puuids are not. */
		puuid: text("puuid").notNull().unique(),
		/** Display casing exactly as the Riot account API returned it. */
		gameName: text("game_name").notNull(),
		/** "NA1", without a leading '#'. */
		tagLine: text("tag_line").notNull(),
		/**
		 * Lowercased copies used for lookup, folded in Node by `AccountRepository`
		 * on the way in and on the way out.
		 *
		 * Real columns rather than `lower()` over the display columns, for two
		 * reasons. Node and Postgres do not fold identically — `ΣΊΣΥΦΟΣ` lowercases
		 * to `σίσυφος` in Node and `σίσυφοσ` in Postgres, and `İSTANBUL` to
		 * `i̇stanbul` and `istanbul` — so a query that folded the input in Node and
		 * the column in SQL would silently never match those names. And `lower()`
		 * is only Unicode-aware because this database was created `en_US.utf8`; one
		 * created `LC_CTYPE=C` folds ASCII only, which riot ids are not restricted
		 * to. Folding in Node behaves the same wherever the database runs.
		 */
		gameNameKey: text("game_name_key").notNull(),
		tagLineKey: text("tag_line_key").notNull(),
		/** Riot routing value the puuid was resolved through ("americas"). */
		region: text("region").notNull(),
		/**
		 * Epoch ms of the last account API call; the TTL is measured from here.
		 * `bigint` because epoch ms overflows a 32-bit `integer` in 1970 + 25 days.
		 */
		riotIdCheckedAt: bigint("riot_id_checked_at", { mode: "number" }).notNull(),
		dateCreated: bigint("date_created", { mode: "number" }).notNull(),
		dateUpdated: bigint("date_updated", { mode: "number" }).notNull(),
	},
	(table) => [
		// Deliberately not unique. A riot id freed by a rename can be claimed by a
		// different puuid, so two rows legitimately carry the same name until the
		// stale one is refreshed; lookups take the most recently checked row.
		index("accounts_by_riot_id").on(
			table.gameNameKey,
			table.tagLineKey,
			sql`${table.riotIdCheckedAt} DESC`,
		),
	],
);
