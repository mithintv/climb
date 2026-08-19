import type { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/sqlite-proxy/migrator";

import type { Drizzle } from "./drizzle.ts";

/**
 * Where `drizzle-kit generate` writes its SQL. Resolved from this module, not
 * the working directory, which is `backend/` for a package script but the repo
 * root for `pnpm test` — a relative path would find nothing there.
 *
 * tsc emits no `.sql`, so the build copies this directory into `dist/` beside
 * the compiled module; see the `build` script.
 */
const MIGRATIONS_FOLDER = fileURLToPath(
	new URL("./migrations", import.meta.url),
);

/**
 * Applies any migration the database has not recorded yet, and returns how many
 * ran. Safe on every boot: an up-to-date database applies nothing.
 *
 * drizzle tracks what it has applied in its own `__drizzle_migrations` table,
 * so the files under `src/database/migrations/` are the only record that matters —
 * they are generated from `schema.ts` and must not be hand-edited.
 */
export const runMigrations = async (db: Drizzle, database: DatabaseSync) => {
	const before = appliedCount(database);

	// The proxy dialect hands the whole migration over as a list of statements
	// and leaves running them to us. They go in one transaction so a migration
	// that fails half way leaves nothing behind.
	await migrate(
		db,
		async (queries) => {
			database.exec("BEGIN");
			try {
				for (const query of queries) database.exec(query);
				database.exec("COMMIT");
			} catch (error) {
				database.exec("ROLLBACK");
				throw error;
			}
		},
		{ migrationsFolder: MIGRATIONS_FOLDER },
	);

	return { applied: appliedCount(database) - before };
};

/**
 * Reads drizzle's own bookkeeping table. It does not exist until the first
 * migration runs, hence the guard rather than a plain count.
 */
const appliedCount = (database: DatabaseSync) => {
	const table = database
		.prepare(
			"SELECT name FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'",
		)
		.get();
	if (!table) return 0;

	const row = database
		.prepare("SELECT COUNT(*) AS applied FROM __drizzle_migrations")
		.get() as { applied: number };
	return row.applied;
};
