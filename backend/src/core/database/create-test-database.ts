import pg from "pg";

import { createDrizzle, type Drizzle } from "./drizzle.ts";
import { runMigrations } from "./run-migrations.ts";

/**
 * Distinguishes the databases one process creates. The pid is not enough on its
 * own: vitest runs several test files in one worker.
 */
let sequence = 0;

/**
 * A migrated, empty database for one test file, isolated from every other.
 *
 * Isolation is a whole database rather than a schema inside one, because
 * drizzle-kit writes `REFERENCES "public"."matches"` into the generated SQL: a
 * table created in some other schema would have its foreign keys pointing back
 * at `public`, and every insert would fail on a row that is right there.
 *
 * Creating it needs CREATEDB, which `scripts/postgres.sh` grants the app's role.
 *
 * The caller must `await teardown()`; a pool left open keeps vitest's worker
 * alive past the end of the run, and the database itself outlives it.
 */
export const createTestDatabase = async (): Promise<{
	db: Drizzle;
	teardown: () => Promise<void>;
}> => {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error(
			"DATABASE_URL is not set. Start Postgres with scripts/postgres.sh and copy backend/.env.example.",
		);
	}

	const name = `climb_test_${process.pid}_${++sequence}`;

	// CREATE DATABASE cannot run inside the database it creates, nor inside a
	// transaction, so it goes through a connection to the configured one.
	const admin = new pg.Pool({ connectionString, max: 1 });
	await admin.query(`CREATE DATABASE ${name}`);

	const url = new URL(connectionString);
	url.pathname = `/${name}`;
	const pool = new pg.Pool({ connectionString: url.toString() });

	const drop = async () => {
		// DROP DATABASE is refused while anything is still connected, so the test's
		// own pool has to go first.
		await pool.end();
		await admin.query(`DROP DATABASE ${name}`);
		await admin.end();
	};

	try {
		const db = createDrizzle(pool);
		await runMigrations(db);
		return { db, teardown: drop };
	} catch (error) {
		await drop();
		throw error;
	}
};
