import { getTableColumns, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestDatabase } from "./create-test-database.ts";
import type { Drizzle } from "./drizzle.ts";
import { accounts } from "./models/accounts.model.ts";
import { matchParticipants } from "./models/match-participants.model.ts";
import { matches } from "./models/matches.model.ts";
import { runMigrations } from "./run-migrations.ts";

let db: Drizzle;
let teardown: () => Promise<void>;

// `createTestDatabase` migrates as part of building the database, so these
// assert re-runs and the resulting shape rather than the first application.
beforeEach(async () => {
	({ db, teardown } = await createTestDatabase());
});

afterEach(() => teardown());

const columnNames = async (table: string) => {
	const { rows } = await db.execute<{ name: string }>(
		sql`SELECT column_name AS name FROM information_schema.columns
			WHERE table_schema = 'public' AND table_name = ${table}
			ORDER BY column_name`,
	);
	return rows.map((row) => row.name);
};

/** The column names a drizzle table declares, ordered to match the query above. */
const declaredColumns = (table: PgTable) =>
	Object.values(getTableColumns(table))
		.map((column) => column.name)
		.sort();

describe("runMigrations", () => {
	it("applies nothing on a second run", async () => {
		const second = await runMigrations(db);

		expect(second.applied).toBe(0);
	});

	it.each([
		["accounts", accounts],
		["matches", matches],
		["match_participants", matchParticipants],
	])("creates every column %s declares", async (table, definition) => {
		// The guard against drift: drizzle-kit generates the SQL from `schema.ts`,
		// so a column added to the schema without regenerating fails here rather
		// than at the first query against a table that lacks it.
		expect(await columnNames(table)).toEqual(declaredColumns(definition));
	});

	it("gives epoch-ms columns a type that can hold one", async () => {
		// `integer` cannot: it tops out 25 days into 1970 when the value is
		// milliseconds.
		const { rows } = await db.execute<{ type: string }>(
			sql`SELECT data_type AS type FROM information_schema.columns
				WHERE table_schema = 'public'
				  AND table_name = 'accounts'
				  AND column_name = 'riot_id_checked_at'`,
		);

		expect(rows[0].type).toBe("bigint");
	});
});
