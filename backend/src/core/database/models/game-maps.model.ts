import { bigint, integer, pgTable } from "drizzle-orm/pg-core";

/**
 * A map, one row per id Riot has been seen to send.
 *
 * Keyed on Riot's own map id for the same reason as `game_queues`: 11 is Summoner's
 * Rift, 12 the ARAM map, 30 Arena, and those numbers are what the payload and
 * every reader already mean by the map. `matches.map_id` therefore keeps Riot's
 * field name while pointing here.
 *
 * Named `game_maps` rather than `maps` because a bare "map" is ambiguous in
 * both SQL and TypeScript, and this is specifically a League map.
 *
 * Names are deliberately absent rather than guessed — CommunityDragon's
 * `maps.json` is the authoritative list and nothing here needs one yet.
 */
export const gameMaps = pgTable("game_maps", {
	/** Riot's map id, e.g. 11. `-1` is the row for a payload that named none. */
	id: integer("id").primaryKey(),
	/** Epoch ms this row was written, which is the first match seen on the map. */
	dateCreated: bigint("date_created", { mode: "number" }).notNull(),
});
