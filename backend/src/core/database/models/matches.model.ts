import { bigint, integer, pgTable, serial, text } from "drizzle-orm/pg-core";

import { bytea } from "./../bytea.ts";

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
	/**
	 * Riot's match id, e.g. "NA1_5451234567". Not split into its parts on top of
	 * `platform_id` and `game_id`, because it is exactly
	 * `platform_id + "_" + game_id` in every sampled payload.
	 */
	matchId: text("match_id").notNull().unique(),
	platformId: text("platform_id").notNull(),
	/** Riot's per-platform game id. Exceeds a 32-bit `integer` on live shards. */
	gameId: bigint("game_id", { mode: "number" }).notNull(),
	/** Match-V5 payload version off `metadata`, e.g. "2". */
	dataVersion: text("data_version"),
	queueId: integer("queue_id"),
	mapId: integer("map_id"),
	/** "CLASSIC", "ARAM", "CHERRY" (Arena). */
	gameMode: text("game_mode"),
	gameType: text("game_type"),
	gameVersion: text("game_version"),
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
