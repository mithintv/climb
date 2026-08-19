import { Test } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestDatabase } from "./../../core/database/create-test-database.ts";
import { DRIZZLE } from "./../../core/database/database.constant.ts";
import type { Drizzle } from "./../../core/database/drizzle.ts";
import { accounts as accountsTable } from "./../../core/database/models/accounts.model.ts";
import { AccountRepository } from "./account.repository.ts";

let accounts: AccountRepository;
let db: Drizzle;
let teardown: () => Promise<void>;

beforeEach(async () => {
	({ db, teardown } = await createTestDatabase());

	// Resolved through Nest's container, over a real database — only the drizzle
	// handle is supplied.
	const moduleRef = await Test.createTestingModule({
		providers: [AccountRepository, { provide: DRIZZLE, useValue: db }],
	}).compile();

	accounts = moduleRef.get(AccountRepository);
});

afterEach(() => teardown());

const account = (puuid: string, gameName: string, tagLine = "NA1") => ({
	puuid,
	gameName,
	tagLine,
	region: "americas",
});

describe("AccountRepository.upsert", () => {
	it("stores Riot's casing and a lowercased lookup key", async () => {
		const row = await accounts.upsert(
			account("puuid-1", "Sneaky", "NA69"),
			1000,
		);

		expect(row.gameName).toBe("Sneaky");
		expect(row.gameNameKey).toBe("sneaky");
		expect(row.tagLineKey).toBe("na69");
		expect(row.riotIdCheckedAt).toBe(1000);
	});

	it("updates the existing row when an account is renamed", async () => {
		await accounts.upsert(account("puuid-1", "OldName"), 1000);
		await accounts.upsert(account("puuid-1", "NewName"), 2000);

		expect(await db.select().from(accountsTable)).toHaveLength(1);
		expect((await accounts.findByRiotId("NewName", "NA1"))?.gameName).toBe(
			"NewName",
		);
	});
});

describe("AccountRepository.findByRiotId", () => {
	it("matches regardless of the casing the caller typed", async () => {
		await accounts.upsert(account("puuid-1", "Sneaky", "NA69"), 1000);

		expect((await accounts.findByRiotId("sNeAkY", "na69"))?.puuid).toBe(
			"puuid-1",
		);
	});

	it("folds case outside ASCII, which a case-insensitive collation cannot", async () => {
		// The reason `game_name_key` exists as a column at all.
		await accounts.upsert(account("puuid-2", "ÖZGÜR"), 1000);

		expect((await accounts.findByRiotId("özgür", "NA1"))?.puuid).toBe(
			"puuid-2",
		);
	});

	it("returns the most recently checked row when a name is reused", async () => {
		// A riot id freed by a rename can be claimed by a different puuid, so two
		// rows legitimately carry the same name until the stale one is refreshed.
		await accounts.upsert(account("puuid-old", "Contested"), 1000);
		await accounts.upsert(account("puuid-new", "Contested"), 2000);

		expect((await accounts.findByRiotId("Contested", "NA1"))?.puuid).toBe(
			"puuid-new",
		);
	});

	it("returns undefined for an unknown riot id", async () => {
		expect(await accounts.findByRiotId("Nobody", "NA1")).toBeUndefined();
	});
});
