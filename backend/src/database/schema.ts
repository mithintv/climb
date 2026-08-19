import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The schema, and the single source of the row types. Anything selecting from
 * these tables is typed from here — `accounts.$inferSelect` replaces the hand
 * written interface and the unchecked cast that used to go with it.
 *
 * The DDL is generated from this file by `pnpm --filter backend db:generate`
 * into `backend/drizzle/`, so there is nothing to keep in sync by hand.
 */
export const accounts = sqliteTable(
	"accounts",
	{
		id: integer("id").primaryKey(),
		/** The only stable identity: riot ids are renameable, puuids are not. */
		puuid: text("puuid").notNull().unique(),
		/** Display casing exactly as the Riot account API returned it. */
		gameName: text("game_name").notNull(),
		/** "NA1", without a leading '#'. */
		tagLine: text("tag_line").notNull(),
		/**
		 * Lowercased copies used for lookup. Real columns rather than COLLATE
		 * NOCASE, which folds ASCII only while riot ids are not restricted to it.
		 */
		gameNameKey: text("game_name_key").notNull(),
		tagLineKey: text("tag_line_key").notNull(),
		/** Riot routing value the puuid was resolved through ("americas"). */
		region: text("region").notNull(),
		/** Epoch ms of the last account API call; the TTL is measured from here. */
		riotIdCheckedAt: integer("riot_id_checked_at").notNull(),
		dateCreated: integer("date_created").notNull(),
		dateUpdated: integer("date_updated").notNull(),
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

/** A row of `accounts`, inferred from the schema above. */
export type IAccountRow = typeof accounts.$inferSelect;

/** The columns required to insert an account. */
export type IAccountInsert = typeof accounts.$inferInsert;
