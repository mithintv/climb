import type { DatabaseSync } from "node:sqlite";

/**
 * Connection settings every handle needs, including the in-memory ones tests
 * open. `foreign_keys` is the load-bearing one: `node:sqlite` leaves it off, so
 * without this every REFERENCES clause in the schema is inert.
 */
export const applyConnectionPragmas = (db: DatabaseSync) => {
	db.exec("PRAGMA foreign_keys = ON");
	// Readers do not block on the writer, so a request can be served while a
	// match ingest is mid-write. Persists in the file; a no-op in memory.
	db.exec("PRAGMA journal_mode = WAL");
	db.exec("PRAGMA busy_timeout = 5000");
	// Safe under WAL, and this database is a rebuildable cache of the Riot API.
	db.exec("PRAGMA synchronous = NORMAL");
};
