import { DatabaseSync } from "node:sqlite";

import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { applyConnectionPragmas } from "./db.utils.ts";
import { createDrizzle, type Drizzle } from "./drizzle.ts";
import { runMigrations } from "./run-migrations.ts";
import { accounts } from "./schema.ts";

let database: DatabaseSync;
let db: Drizzle;

beforeEach(async () => {
	database = new DatabaseSync(":memory:");
	applyConnectionPragmas(database);
	db = createDrizzle(database);
	await runMigrations(db, database);
});

const row = (puuid: string, checkedAt = 1000) => ({
	puuid,
	gameName: puuid,
	tagLine: "NA1",
	gameNameKey: puuid,
	tagLineKey: "na1",
	region: "americas",
	riotIdCheckedAt: checkedAt,
	dateCreated: checkedAt,
	dateUpdated: checkedAt,
});

const count = () =>
	(
		database.prepare("SELECT COUNT(*) AS n FROM accounts").get() as {
			n: number;
		}
	).n;

describe("createDrizzle", () => {
	it("returns undefined rather than a row of undefined columns on a miss", async () => {
		// drizzle decides "no result" by truthiness, so the driver has to pass
		// undefined through instead of an empty array.
		const missing = await db.query.accounts.findFirst({
			where: eq(accounts.puuid, "nobody"),
		});

		expect(missing).toBeUndefined();
	});

	it("round-trips values through the positional row mapping", async () => {
		await db.insert(accounts).values(row("puuid-1"));

		const found = await db.query.accounts.findFirst({
			where: eq(accounts.puuid, "puuid-1"),
		});

		expect(found?.gameName).toBe("puuid-1");
		expect(found?.riotIdCheckedAt).toBe(1000);
	});

	it("commits a transaction", async () => {
		await db.transaction(async (tx) => {
			await tx.insert(accounts).values(row("puuid-1"));
		});

		expect(count()).toBe(1);
	});

	it("rolls a failed transaction back", async () => {
		await expect(
			db.transaction(async (tx) => {
				await tx.insert(accounts).values(row("puuid-1"));
				throw new Error("abort");
			}),
		).rejects.toThrow("abort");

		expect(count()).toBe(0);
	});

	it("does not let two transactions interleave", async () => {
		// The driver is async over a synchronous, single-connection database, so
		// without the lock the second BEGIN would land inside the first
		// transaction and SQLite would reject it — or worse, commit both together.
		const first = db.transaction(async (tx) => {
			await tx.insert(accounts).values(row("puuid-1"));
			await new Promise((resolve) => setTimeout(resolve, 10));
			await tx.insert(accounts).values(row("puuid-2"));
		});

		const second = db.transaction(async (tx) => {
			await tx.insert(accounts).values(row("puuid-3"));
		});

		await Promise.all([first, second]);

		expect(count()).toBe(3);
	});

	it("releases the lock after a rollback, so later writes still run", async () => {
		await expect(
			db.transaction(async (tx) => {
				await tx.insert(accounts).values(row("puuid-1"));
				throw new Error("abort");
			}),
		).rejects.toThrow();

		await db.transaction(async (tx) => {
			await tx.insert(accounts).values(row("puuid-2"));
		});

		expect(count()).toBe(1);
	});
});
