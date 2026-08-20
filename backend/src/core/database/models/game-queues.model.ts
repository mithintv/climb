import { bigint, integer, pgTable } from "drizzle-orm/pg-core";

/**
 * A matchmaking queue, one row per id Riot has been seen to send.
 *
 * The primary key is Riot's own queue id — 420 ranked solo, 450 ARAM, 1700
 * Arena — not a surrogate. Those ids are stable and are what everything already
 * means by "the queue", so `matches.queue_id` keeps Riot's field name and gains
 * a foreign key rather than needing a join to say anything at all.
 *
 * Named `game_queues` rather than `queues` because a bare "queue" reads as a job
 * queue, which this is not.
 *
 * The table exists to hang a display name off later; today it records only that
 * the queue was seen. Rows are created by ingest, never seeded — Riot rotates
 * queues in and out, so a queue this build has never heard of must insert.
 */
export const gameQueues = pgTable("game_queues", {
	/** Riot's queue id, e.g. 420. `-1` is the row for a payload that named none. */
	id: integer("id").primaryKey(),
	/** Epoch ms this row was written, which is the first match seen in the queue. */
	dateCreated: bigint("date_created", { mode: "number" }).notNull(),
});
