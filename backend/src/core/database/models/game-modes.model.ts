import { bigint, pgTable, serial, text } from "drizzle-orm/pg-core";

/**
 * A game mode, one row per value Riot has been seen to send.
 *
 * `mode` is Riot's own token, not a display name: "CLASSIC", "ARAM", "CHERRY"
 * — which is Arena. Storing the token keeps the column faithful to the payload;
 * a label to show a user belongs here as a second column when something needs
 * one, which is the reason this is a table rather than a text column on
 * `matches`.
 *
 * Rows are created by ingest as new modes appear. Riot adds modes without
 * warning — rotating game modes come and go — so a mode this build has never
 * heard of must insert rather than fail.
 */
export const gameModes = pgTable("game_modes", {
	id: serial("id").primaryKey(),
	/** Riot's token, uppercase, e.g. "CHERRY". */
	mode: text("mode").notNull().unique(),
	/** Epoch ms this row was written, which is the first match seen in the mode. */
	dateCreated: bigint("date_created", { mode: "number" }).notNull(),
});
