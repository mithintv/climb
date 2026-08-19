import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { matches } from "./matches.model.ts";

/**
 * The per-player projection: only what a match card renders.
 *
 * Anything else stays in the payload on `matches`. Adding a column here is a
 * migration plus a re-projection of the stored blobs, never a re-fetch.
 */
export const matchParticipants = pgTable(
	"match_participants",
	{
		id: serial("id").primaryKey(),
		matchRowId: integer("match_row_id")
			.notNull()
			.references(() => matches.id, { onDelete: "cascade" }),
		/** Position in `info.participants`, which is also Riot's own ordering. */
		participantIndex: integer("participant_index").notNull(),
		/**
		 * No foreign key to `accounts`: some queues report entries that are not
		 * players, and a match is ingested long before every player is an account.
		 */
		puuid: text("puuid").notNull(),
		/** The riot id as recorded at game time, which a later rename does not change. */
		riotIdGameName: text("riot_id_game_name"),
		riotIdTagline: text("riot_id_tagline"),
		/** 100 or 200; 0 for one of the two Arena "teams". */
		teamId: integer("team_id"),
		/** "TOP".."UTILITY", and "" in every queue without lanes. */
		teamPosition: text("team_position"),
		championId: integer("champion_id"),
		championName: text("champion_name"),
		win: boolean("win"),
		kills: integer("kills"),
		deaths: integer("deaths"),
		assists: integer("assists"),
		goldEarned: integer("gold_earned"),
		totalMinionsKilled: integer("total_minions_killed"),
		neutralMinionsKilled: integer("neutral_minions_killed"),
		summoner1Id: integer("summoner1_id"),
		summoner2Id: integer("summoner2_id"),
		item0: integer("item0"),
		item1: integer("item1"),
		item2: integer("item2"),
		item3: integer("item3"),
		item4: integer("item4"),
		item5: integer("item5"),
		item6: integer("item6"),
		/** Off `perks.styles`: the primary tree, its keystone, and the secondary tree. */
		perkPrimaryStyle: integer("perk_primary_style"),
		perkKeystone: integer("perk_keystone"),
		perkSubStyle: integer("perk_sub_style"),
		/** Arena finishing position, 1-8. Null in every other queue. */
		placement: integer("placement"),
	},
	(table) => [
		// The identity of a row: a player can only appear once at a given index,
		// and re-ingesting the same match must not double the participants.
		uniqueIndex("match_participants_by_index").on(
			table.matchRowId,
			table.participantIndex,
		),
		// Serves "this player's matches", which is the only way these are read.
		index("match_participants_by_puuid").on(table.puuid, table.matchRowId),
	],
);
