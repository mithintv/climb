import { bigint, pgTable, serial, text } from "drizzle-orm/pg-core";

/**
 * A game type, one row per value Riot has been seen to send.
 *
 * `type` is Riot's own token — "MATCHED_GAME" for anything matchmade,
 * "CUSTOM_GAME" for a lobby someone made. It is a surrogate key rather than
 * Riot's, because unlike a queue or a map this arrives as text with no id.
 *
 * Rows are created by ingest as new types appear.
 */
export const gameTypes = pgTable("game_types", {
	id: serial("id").primaryKey(),
	/** Riot's token, uppercase, e.g. "MATCHED_GAME". */
	type: text("type").notNull().unique(),
	/** Epoch ms this row was written, which is the first match seen of the type. */
	dateCreated: bigint("date_created", { mode: "number" }).notNull(),
});
