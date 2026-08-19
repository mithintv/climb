import type { DatabaseSync } from "node:sqlite";

import { drizzle } from "drizzle-orm/sqlite-proxy";

import * as schema from "./schema.ts";

/**
 * Serialises transactions. `node:sqlite` is synchronous but drizzle's proxy
 * driver is async, so between two `await`s inside one `db.transaction()` another
 * request can slip a statement in — and SQLite has a single connection-wide
 * transaction, so that statement would join, and be committed or rolled back
 * with, a transaction it has nothing to do with.
 *
 * The lock is taken when `BEGIN` goes past and released on `COMMIT`/`ROLLBACK`.
 */
const createTransactionLock = () => {
	let tail: Promise<void> = Promise.resolve();
	let release: (() => void) | null = null;

	return {
		async acquire() {
			const previous = tail;
			let unlock: () => void = () => {};
			tail = new Promise<void>((resolve) => {
				unlock = resolve;
			});
			await previous;
			release = unlock;
		},
		/** Idempotent: a rollback after a failed commit must not double-release. */
		release() {
			const unlock = release;
			release = null;
			unlock?.();
		},
	};
};

/**
 * `node:sqlite` rejects values it has no column type for. Booleans are the ones
 * that actually turn up, since SQLite has no boolean and drizzle passes through
 * whatever the caller wrote.
 */
const toSqliteValue = (value: unknown) => {
	if (typeof value === "boolean") return value ? 1 : 0;
	if (value === undefined) return null;
	return value as null | number | bigint | string | Uint8Array;
};

/**
 * Drizzle over the builtin driver, through the proxy dialect. The proxy exists
 * for remote databases, but it is simply "give me a function that runs SQL",
 * which is exactly what `DatabaseSync` is — and it keeps `node:sqlite` rather
 * than pulling in a native module.
 */
export const createDrizzle = (database: DatabaseSync) => {
	const lock = createTransactionLock();

	return drizzle(
		async (query, params, method) => {
			const normalised = params.map(toSqliteValue);
			const statement = database.prepare(query);

			// Transaction control statements come through as ordinary queries.
			const command = query.trim().slice(0, 8).toLowerCase();
			if (command.startsWith("begin")) await lock.acquire();

			try {
				if (method === "run") {
					statement.run(...normalised);
					return { rows: [] };
				}

				// The proxy maps columns positionally, so rows must be arrays of
				// values rather than objects. Node 24 does that natively.
				statement.setReturnArrays(true);

				if (method === "get") {
					// Passed through undefined when there is no row: drizzle decides
					// "no result" by truthiness, so an empty array would instead be
					// mapped into a row whose every column is undefined.
					// The node:sqlite types describe the object form; setReturnArrays
					// above switches the runtime shape to positional arrays.
					const row = statement.get(...normalised) as unknown as unknown[];
					return { rows: row };
				}

				return { rows: statement.all(...normalised) as unknown as unknown[][] };
			} finally {
				if (command.startsWith("commit") || command.startsWith("rollback")) {
					lock.release();
				}
			}
		},
		{ schema },
	);
};

/** The drizzle handle, inferred so callers do not restate it. */
export type Drizzle = ReturnType<typeof createDrizzle>;
