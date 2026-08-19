import { DatabaseSync } from "node:sqlite";

import { beforeEach, describe, expect, it } from "vitest";

import { applyConnectionPragmas } from "./db.utils.ts";
import { createDrizzle, type Drizzle } from "./drizzle.ts";
import { runMigrations } from "./run-migrations.ts";
import { accounts } from "./schema.ts";

let database: DatabaseSync;
let db: Drizzle;

beforeEach(() => {
	database = new DatabaseSync(":memory:");
	applyConnectionPragmas(database);
	db = createDrizzle(database);
});

const columnNames = (table: string) =>
	(
		database.prepare(`PRAGMA table_info(${table})`).all() as {
			name: string;
		}[]
	)
		.map((column) => column.name)
		.sort();

describe("runMigrations", () => {
	it("applies the generated migrations to an empty database", async () => {
		const { applied } = await runMigrations(db, database);

		expect(applied).toBeGreaterThan(0);
		expect(columnNames("accounts")).toContain("puuid");
	});

	it("applies nothing on a second run", async () => {
		await runMigrations(db, database);

		const second = await runMigrations(db, database);

		expect(second.applied).toBe(0);
	});

	it("creates every column the schema declares", async () => {
		// The guard against drift: drizzle-kit generates the SQL from `schema.ts`,
		// so a column added to the schema without regenerating fails here rather
		// than at the first query against a table that lacks it.
		await runMigrations(db, database);

		const declared = Object.values(accounts)
			.filter(
				(column): column is { name: string } =>
					typeof column === "object" && column !== null && "name" in column,
			)
			.map((column) => column.name)
			.sort();

		expect(columnNames("accounts")).toEqual(declared);
	});
});
