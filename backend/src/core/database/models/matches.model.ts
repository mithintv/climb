import { type SQL, sql } from "drizzle-orm";
import { bigint, integer, pgTable, serial, text } from "drizzle-orm/pg-core";

import { bytea } from "./../bytea.ts";
import { gameMaps } from "./game-maps.model.ts";
import { gameModes } from "./game-modes.model.ts";
import { gamePlatforms } from "./game-platforms.model.ts";
import { gameQueues } from "./game-queues.model.ts";
import { gameTypes } from "./game-types.model.ts";
import { patches } from "./patches.model.ts";

/**
 * One completed match, stored whole.
 *
 * The payload is the record; the columns beside it are a projection of the few
 * fields the app filters and sorts on. A completed match is immutable, so a row
 * here never needs refreshing — only re-projecting, which the blob makes
 * possible without going back to Riot.
 *
 * There is no puuid dimension: fetching one match on behalf of four different
 * participants returns four byte-identical bodies, so the ten players in a game
 * share this one row.
 *
 * Every projected column off `info` is nullable. Riot adds and removes fields
 * between patches, and ingest must never fail because a projection came back
 * empty — the blob is the contract.
 */
export const matches = pgTable("matches", {
	id: serial("id").primaryKey(),
	/** The shard the game was played on, e.g. "NA1". */
	platformId: text("platform_id")
		.notNull()
		.references(() => gamePlatforms.id),
	/** Riot's per-platform game id. Exceeds a 32-bit `integer` on live shards. */
	gameId: bigint("game_id", { mode: "number" }).notNull(),
	/**
	 * Riot's match id, e.g. "NA1_5451234567" — computed, not stored twice.
	 *
	 * It is exactly `platform_id + "_" + game_id` in every sampled payload, so
	 * the database derives it rather than trusting a caller to keep the three in
	 * step. `STORED` rather than a view or an expression index because this is
	 * what every read looks a match up by and what carries the unique constraint.
	 *
	 * Being generated means it is never inserted: `matches.$inferInsert` leaves
	 * it out, and `INSERT … (match_id)` is an error rather than a silent
	 * overwrite.
	 */
	matchId: text("match_id")
		.notNull()
		.unique()
		.generatedAlwaysAs(
			(): SQL => sql`${matches.platformId} || '_' || ${matches.gameId}`,
		),
	/** Match-V5 payload version off `metadata`, e.g. "2". */
	dataVersion: text("data_version"),
	/**
	 * What the match was: its queue, map, mode, type and patch, each a row in its
	 * own table rather than a value repeated across every match.
	 *
	 * `queue_id` and `map_id` still hold Riot's own numbers — 420, 11 — because
	 * those tables are keyed on them; the other three are surrogate ids.
	 *
	 * All five are `NOT NULL`, unlike every other projected column, so a reader
	 * never has to handle a match with no queue or no patch. Ingest keeps that
	 * true without being able to fail: a payload that does not say resolves to
	 * the "unknown" rows instead — see `unknown-lookup-row.constant.ts`.
	 */
	queueId: integer("queue_id")
		.notNull()
		.references(() => gameQueues.id),
	mapId: integer("map_id")
		.notNull()
		.references(() => gameMaps.id),
	gameModeId: integer("game_mode_id")
		.notNull()
		.references(() => gameModes.id),
	gameTypeId: integer("game_type_id")
		.notNull()
		.references(() => gameTypes.id),
	patchId: integer("patch_id")
		.notNull()
		.references(() => patches.id),
	gameCreation: bigint("game_creation", { mode: "number" }),
	gameStartMs: bigint("game_start_ms", { mode: "number" }),
	gameEndMs: bigint("game_end_ms", { mode: "number" }),
	/** Seconds, not ms — Riot reports this one in seconds for modern patches. */
	gameDuration: integer("game_duration"),
	/** "GameComplete" or "Abort_Unexpected"; absent on older payloads. */
	endOfGameResult: text("end_of_game_result"),
	/** The response body byte-exact, compressed. See `match-payload.utils.ts`. */
	payload: bytea("payload").notNull(),
	/** Codec the bytes are in ("gzip"), so swapping it later is a data change. */
	payloadEncoding: text("payload_encoding").notNull(),
	/** Length of the decoded body, for measuring what is saved without decompressing. */
	payloadBytes: integer("payload_bytes").notNull(),
	/** Which release of the extractors produced the columns beside the payload. */
	projectionVersion: integer("projection_version").notNull(),
	/** Epoch ms the payload was fetched from Riot. */
	fetchedAt: bigint("fetched_at", { mode: "number" }).notNull(),
});
