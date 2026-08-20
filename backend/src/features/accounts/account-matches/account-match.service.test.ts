import { Test } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestDatabase } from "./../../../core/database/create-test-database.ts";
import { DRIZZLE } from "./../../../core/database/database.constant.ts";
import { RiotApiService } from "./../../../integrations/riot/riot-api.service.ts";
import { AccountRepository } from "./../account.repository.ts";
import { AccountMatchRepository } from "./account-match.repository.ts";
import { AccountMatchService } from "./account-match.service.ts";
import { ACCOUNT_MATCH_HEAD_TTL_MS } from "./account-match-sync.constant.ts";

const PUUID = "puuid-1";
const NOW = 1_700_000_000_000;

/** Riot's list for the account, newest first — the thing being cached. */
let history: string[];
let fetchMatchIds: ReturnType<typeof vi.fn>;
let service: AccountMatchService;
let teardown: () => Promise<void>;

/** `count` ids counting down from `from`, in Riot's own newest-first order. */
const games = (from: number, count: number) =>
	Array.from({ length: count }, (_, offset) => `NA1_${from - offset}`);

beforeEach(async () => {
	const database = await createTestDatabase();
	teardown = database.teardown;

	history = games(1030, 30);
	// Riot's endpoint, modelled as the window over the list that it is — which is
	// exactly why an offset is not a stable cursor.
	fetchMatchIds = vi.fn(async (_puuid: string, start: number, count: number) =>
		history.slice(start, start + count),
	);

	const moduleRef = await Test.createTestingModule({
		providers: [AccountMatchService, AccountMatchRepository, AccountRepository],
	})
		.useMocker((token) => {
			if (token === DRIZZLE) return database.db;
			if (token === RiotApiService) return { fetchMatchIds };
		})
		.compile();

	service = moduleRef.get(AccountMatchService);

	// The index hangs off an account row, so there has to be one to hang it off.
	await moduleRef.get(AccountRepository).upsert(
		{
			puuid: PUUID,
			gameName: "Sneaky",
			tagLine: "NA69",
			region: "americas",
		},
		NOW,
	);
});

afterEach(() => teardown());

describe("AccountMatchService.getMatchIds", () => {
	it("serves the window and caches the ids it fetched", async () => {
		const first = await service.getMatchIds(PUUID, { start: 0, count: 5 }, NOW);

		expect(first).toEqual(games(1030, 5));
		expect(fetchMatchIds).toHaveBeenCalledTimes(1);
	});

	it("serves a repeat request inside the TTL without calling Riot", async () => {
		await service.getMatchIds(PUUID, { start: 0, count: 5 }, NOW);

		const again = await service.getMatchIds(
			PUUID,
			{ start: 0, count: 5 },
			NOW + ACCOUNT_MATCH_HEAD_TTL_MS - 1,
		);

		expect(again).toEqual(games(1030, 5));
		expect(fetchMatchIds).toHaveBeenCalledTimes(1);
	});

	it("reads the head again once the TTL has expired, and picks up new games", async () => {
		await service.getMatchIds(PUUID, { start: 0, count: 5 }, NOW);
		history = [...games(1032, 2), ...history];

		const later = await service.getMatchIds(
			PUUID,
			{ start: 0, count: 5 },
			NOW + ACCOUNT_MATCH_HEAD_TTL_MS,
		);

		expect(later).toEqual(games(1032, 5));
		expect(fetchMatchIds).toHaveBeenCalledTimes(2);
	});

	it("backfills until the window is filled", async () => {
		const deep = await service.getMatchIds(PUUID, { start: 0, count: 25 }, NOW);

		expect(deep).toEqual(games(1030, 25));
	});

	it("stops calling Riot once the backfill has reached the tail", async () => {
		// The window asks for more than the account has ever played, so the first
		// request runs the backfill out and marks it complete.
		const all = await service.getMatchIds(PUUID, { start: 0, count: 50 }, NOW);
		expect(all).toHaveLength(30);
		const callsToReachTheTail = fetchMatchIds.mock.calls.length;

		const again = await service.getMatchIds(
			PUUID,
			{ start: 0, count: 50 },
			NOW + 1,
		);

		expect(again).toHaveLength(30);
		// Not "no more calls": the head TTL is a separate clock and this request
		// is inside it. The point is that nothing goes looking for a tail that has
		// already been found.
		expect(fetchMatchIds).toHaveBeenCalledTimes(callsToReachTheTail);
	});

	it("pages by cursor without repeating or skipping when games finish in between", async () => {
		// The bug this whole index exists to fix. Two games land between the two
		// requests, shifting every offset in Riot's list right by two.
		const first = await service.getMatchIds(
			PUUID,
			{ start: 0, count: 10 },
			NOW,
		);
		history = [...games(1032, 2), ...history];

		const second = await service.getMatchIds(
			PUUID,
			{ beforeGameId: 1021, start: 0, count: 10 },
			NOW + ACCOUNT_MATCH_HEAD_TTL_MS,
		);

		expect(first).toEqual(games(1030, 10));
		expect(second).toEqual(games(1020, 10));
		expect(second.filter((id) => first.includes(id))).toEqual([]);
	});

	it("still shifts when paged by offset, which is why the cursor exists", async () => {
		const first = await service.getMatchIds(
			PUUID,
			{ start: 0, count: 10 },
			NOW,
		);
		history = [...games(1032, 2), ...history];

		const second = await service.getMatchIds(
			PUUID,
			{ start: 10, count: 10 },
			NOW + ACCOUNT_MATCH_HEAD_TTL_MS,
		);

		// Two ids the client has already seen, and two it now never will —
		// unchanged from the old behaviour, because an offset into a list that
		// grows at the head cannot be stable however the list is stored.
		expect(second.filter((id) => first.includes(id))).toEqual([
			"NA1_1022",
			"NA1_1021",
		]);
	});
});
