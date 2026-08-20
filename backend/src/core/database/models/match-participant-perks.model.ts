import {
	integer,
	pgTable,
	serial,
	text,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import type { PerkKind } from "./../types/perk-kind.type.ts";
import { matchParticipants } from "./match-participants.model.ts";
import { perks } from "./perks.model.ts";

/**
 * One perk a participant took, so a whole rune page — trees, runes and stat
 * shards — is reconstructable without reading the payload.
 *
 * Nine rows per participant on a normal match: four picks from the primary
 * tree, two from the secondary, and three stat shards. `kind` says which of
 * those a row is and how to read its `slot`; see `perk-kind.type.ts`.
 *
 * The tree each pick came from is recorded on the row rather than derived,
 * because a rune's tree in `perks` is what Data Dragon says it is today and the
 * row should say what the payload said at game time.
 */
export const matchParticipantPerks = pgTable(
	"match_participant_perks",
	{
		id: serial("id").primaryKey(),
		matchParticipantId: integer("match_participant_id")
			.notNull()
			.references(() => matchParticipants.id, { onDelete: "cascade" }),
		/** `PRIMARY`, `SECONDARY` or `STAT`. */
		kind: text("kind").$type<PerkKind>().notNull(),
		/** Position within the kind; slot 0 of `PRIMARY` is the keystone. */
		slot: integer("slot").notNull(),
		/**
		 * The tree this pick came from, as the payload reported it. Null for stat
		 * shards, which belong to no tree.
		 */
		styleId: integer("style_id").references(() => perks.id),
		perkId: integer("perk_id")
			.notNull()
			.references(() => perks.id),
	},
	(table) => [
		// A participant fills each slot of each kind once, and re-ingesting a match
		// must not double them.
		uniqueIndex("match_participant_perks_by_slot").on(
			table.matchParticipantId,
			table.kind,
			table.slot,
		),
	],
);
