import { fileURLToPath } from "node:url";

import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";

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
 * drizzle tracks what it has applied in `drizzle.__drizzle_migrations`, so the
 * files under `src/core/database/migrations/` are the only record that matters —
 * they are generated from `schema.ts` and must not be hand-edited.
 */
export const runMigrations = async (db: Drizzle) => {
	const before = await appliedCount(db);

	// The node-postgres migrator runs each file in its own transaction, so a
	// migration that fails half way leaves nothing behind.
	await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

	return { applied: (await appliedCount(db)) - before };
};

/**
 * Reads drizzle's own bookkeeping table, which does not exist until the first
 * migration runs.
 *
 * The existence check is its own statement rather than a branch inside one:
 * Postgres resolves every table named anywhere in a statement while parsing it,
 * so a `CASE` that never evaluates the count still fails on the missing table.
 */
const appliedCount = async (db: Drizzle) => {
	const { rows: found } = await db.execute<{ tableOid: number | null }>(
		sql`SELECT to_regclass('drizzle.__drizzle_migrations')::oid AS "tableOid"`,
	);
	if (!found[0]?.tableOid) return 0;

	// COUNT(*) is bigint, which node-postgres returns as a string rather than
	// silently losing precision.
	const { rows } = await db.execute<{ applied: string }>(
		sql`SELECT COUNT(*) AS applied FROM drizzle.__drizzle_migrations`,
	);
	return Number(rows[0]?.applied ?? 0);
};
