import { Test } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestDatabase } from "./../../core/database/create-test-database.ts";
import { DRIZZLE } from "./../../core/database/database.constant.ts";
import { RiotApiService } from "./../../integrations/riot/riot-api.service.ts";
import type { IRiotAccount } from "./../../integrations/riot/types/i-riot-account.type.ts";
import { RIOT_ID_TTL_MS } from "./account.constant.ts";
import { AccountRepository } from "./account.repository.ts";
import { AccountService, isRiotIdFresh } from "./account.service.ts";

const SNEAKY: IRiotAccount = {
	puuid: "puuid-1",
	gameName: "Sneaky",
	tagLine: "NA69",
};

let service: AccountService;
let fetchAccount: ReturnType<typeof vi.fn>;
let teardown: () => Promise<void>;

beforeEach(async () => {
	const database = await createTestDatabase();
	const db = database.db;
	teardown = database.teardown;

	fetchAccount = vi.fn(async () => SNEAKY);

	// Resolved through Nest's own container rather than `new`, so a provider
	// missing from a module fails here instead of at boot. Only the Riot client
	// is substituted; the repository is the real one, over a real database.
	const moduleRef = await Test.createTestingModule({
		providers: [AccountService, AccountRepository],
	})
		.useMocker((token) => {
			if (token === DRIZZLE) return db;
			if (token === RiotApiService) return { fetchAccount };
		})
		.compile();

	service = moduleRef.get(AccountService);
});

afterEach(() => teardown());

describe("isRiotIdFresh", () => {
	it("is false exactly at the TTL, so the boundary refetches", () => {
		expect(isRiotIdFresh(0, RIOT_ID_TTL_MS - 1)).toBe(true);
		expect(isRiotIdFresh(0, RIOT_ID_TTL_MS)).toBe(false);
	});
});

describe("AccountService.resolveByRiotId", () => {
	it("calls Riot on a miss and caches the result", async () => {
		const first = await service.resolveByRiotId("Sneaky", "NA69", 1000);

		expect(first.cached).toBe(false);
		expect(first.account.puuid).toBe("puuid-1");
		expect(fetchAccount).toHaveBeenCalledWith("Sneaky", "NA69");
	});

	it("serves a fresh row without calling Riot", async () => {
		await service.resolveByRiotId("Sneaky", "NA69", 1000);

		const second = await service.resolveByRiotId(
			"Sneaky",
			"NA69",
			1000 + RIOT_ID_TTL_MS - 1,
		);

		expect(second.cached).toBe(true);
		expect(fetchAccount).toHaveBeenCalledTimes(1);
	});

	it("refetches once the riot id has aged past the TTL", async () => {
		// Not because the name drifts, but because a riot id released by a rename
		// can be claimed by a different account, so a stale row can name the wrong
		// player.
		await service.resolveByRiotId("Sneaky", "NA69", 1000);

		const later = await service.resolveByRiotId(
			"Sneaky",
			"NA69",
			1000 + RIOT_ID_TTL_MS,
		);

		expect(later.cached).toBe(false);
		expect(fetchAccount).toHaveBeenCalledTimes(2);
	});

	it("matches the cached row case-insensitively", async () => {
		await service.resolveByRiotId("Sneaky", "NA69", 1000);

		const typed = await service.resolveByRiotId("sneaky", "na69", 1000);

		expect(typed.cached).toBe(true);
		expect(fetchAccount).toHaveBeenCalledTimes(1);
	});
});
