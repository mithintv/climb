import { bigint, pgTable, text } from "drizzle-orm/pg-core";

/**
 * A platform — the shard a game was played on — one row per value Riot has been
 * seen to send.
 *
 * Keyed on Riot's own token, "NA1" or "EUW1", rather than a surrogate. That is
 * what makes `matches.match_id` computable: it is exactly
 * `platform_id + "_" + game_id`, so the platform has to stay readable on the
 * match row rather than becoming a number that only a join could expand.
 *
 * Distinct from the routing region an account was resolved through
 * (`accounts.region`, "americas") — several platforms route through one region.
 */
export const gamePlatforms = pgTable("game_platforms", {
	/** Riot's platform token, uppercase, e.g. "NA1". */
	id: text("id").primaryKey(),
	/** Epoch ms this row was written, which is the first match seen on the platform. */
	dateCreated: bigint("date_created", { mode: "number" }).notNull(),
});
