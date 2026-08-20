import { Test } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestDatabase } from "./../../../core/database/create-test-database.ts";
import { DRIZZLE } from "./../../../core/database/database.constant.ts";
import { RiotApiService } from "./../../../integrations/riot/riot-api.service.ts";
import { splitMatchId } from "./../../../lib/split-match-id.ts";
import { readMatchFixture } from "./../../matches/fixtures/read-match-fixture.ts";
import { MatchRepository } from "./../../matches/match.repository.ts";
import { MatchService } from "./../../matches/match.service.ts";
import { AccountRepository } from "./../account.repository.ts";
import { AccountMatchRepository } from "./account-match.repository.ts";
import {
	ACCOUNT_MATCH_INGEST_CHUNK,
	ACCOUNT_MATCH_PAGE_SIZE,
} from "./account-match-sync.constant.ts";
import { AccountMatchSyncService } from "./account-match-sync.service.ts";

const PUUID = "puuid-1";
const NOW = 1_700_000_000_000;

/** Riot's list for the account, newest first — the thing being synced. */
let history: string[];
let fetchMatchIds: ReturnType<typeof vi.fn>;
/** Stands in for a payload fetch, saving the same rows the real one would. */
let getMatchBody: (matchId: string) => Promise<{ body: string }>;
/** Every id a payload was fetched for, in order. */
let fetched: string[];
let service: AccountMatchSyncService;
let accountMatches: AccountMatchRepository;
let accountId: number;
let teardown: () => Promise<void>;

/** `count` ids counting down from `from`, in Riot's own newest-first order. */
const games = (from: number, count: number) =>
	Array.from({ length: count }, (_, offset) => `NA1_${from - offset}`);

/** Runs chunks until the account reports itself finished. */
const advanceUntilDone = async (limit = 100) => {
	for (let chunk = 0; chunk < limit; chunk += 1) {
		const progress = await service.advance(PUUID, NOW + chunk);
		if (progress.done) return chunk + 1;
	}
	throw new Error(`Still not done after ${limit} chunks`);
};

beforeEach(async () => {
	const database = await createTestDatabase();
	teardown = database.teardown;

	history = games(1030, 30);
	fetched = [];
	// Riot's endpoint, modelled as the window over the list that it is — which is
	// exactly why an offset is not a stable cursor.
	fetchMatchIds = vi.fn(async (_puuid: string, start: number, count: number) =>
		history.slice(start, start + count),
	);

	const moduleRef = await Test.createTestingModule({
		providers: [
			AccountMatchSyncService,
			AccountMatchRepository,
			AccountRepository,
			MatchRepository,
		],
	})
		.useMocker((token) => {
			if (token === DRIZZLE) return database.db;
			if (token === RiotApiService) return { fetchMatchIds };
			// Delegated rather than handed over: the fake needs the repository this
			// module is still compiling, so it does not exist yet at this point.
			if (token === MatchService) {
				return { getMatchBody: (matchId: string) => getMatchBody(matchId) };
			}
		})
		.compile();

	const matches = moduleRef.get(MatchRepository);
	// The real thing fetches a payload and saves it. The saving is what a sync is
	// for, so the fake does that and skips the network.
	getMatchBody = async (matchId: string) => {
		fetched.push(matchId);
		const dto = JSON.parse(readMatchFixture("queue-420-ranked-20260724"));
		dto.metadata.matchId = matchId;
		dto.info.gameId = splitMatchId(matchId).gameId;
		// One participant rather than ten: a sync test is about bookkeeping, and a
		// full roster per match makes the fixture the slow part of the run.
		dto.info.participants = dto.info.participants.slice(0, 1);
		const body = JSON.stringify(dto);
		await matches.ingest({ matchId, body, dto, fetchedAt: NOW });
		return { body };
	};

	service = moduleRef.get(AccountMatchSyncService);
	accountMatches = moduleRef.get(AccountMatchRepository);

	// The index hangs off an account row, so there has to be one to hang it off.
	const account = await moduleRef
		.get(AccountRepository)
		.upsert(
			{ puuid: PUUID, gameName: "Sneaky", tagLine: "NA69", region: "americas" },
			NOW,
		);
	accountId = account.id;
});

afterEach(() => teardown());

describe("AccountMatchSyncService.sync", () => {
	it("indexes the head and leaves the rest to the worker", async () => {
		const result = await service.sync(PUUID, NOW);

		// One page of ids: the newest games are in, and every one of them is still
		// waiting on a payload nobody has fetched.
		expect(result.indexed).toBe(ACCOUNT_MATCH_PAGE_SIZE);
		expect(result.pending).toBe(ACCOUNT_MATCH_PAGE_SIZE);
		expect(result.backfillComplete).toBe(false);
		expect(fetched).toEqual([]);
	});

	it("picks up games played since the last sync, with no TTL in the way", async () => {
		await service.sync(PUUID, NOW);
		history = [...games(1032, 2), ...history];

		// One millisecond later: a sync is someone asking for the newest games, so
		// there is nothing to wait for.
		const result = await service.sync(PUUID, NOW + 1);

		expect(result.indexed).toBe(2);
	});

	it("adds nothing on a second sync when nothing has been played", async () => {
		await service.sync(PUUID, NOW);
		const result = await service.sync(PUUID, NOW + 1);

		expect(result.indexed).toBe(0);
	});

	it("refuses to sync a puuid with no account row", async () => {
		await expect(service.sync("puuid-nobody-resolved", NOW)).rejects.toThrow(
			/No account row/,
		);
	});
});

describe("AccountMatchSyncService.advance", () => {
	it("fetches a bounded chunk of payloads, newest first", async () => {
		await service.sync(PUUID, NOW);

		const progress = await service.advance(PUUID, NOW + 1);

		expect(progress.ingested).toBe(ACCOUNT_MATCH_INGEST_CHUNK);
		expect(fetched[0]).toBe("NA1_1030");
		expect(progress.done).toBe(false);
	});

	it("does not reach deeper while payloads are still outstanding", async () => {
		await service.sync(PUUID, NOW);

		const progress = await service.advance(PUUID, NOW + 1);

		// Fifteen of the twenty ids indexed by the sync still have no payload, so
		// this chunk fetched five of them and left the history where it was. Doing
		// both would have taken the outstanding count up rather than down.
		expect(progress.indexed).toBe(0);
		expect(progress.pending).toBe(
			ACCOUNT_MATCH_PAGE_SIZE - ACCOUNT_MATCH_INGEST_CHUNK,
		);
	});

	it("saves games on every chunk and keeps the outstanding count bounded", async () => {
		await service.sync(PUUID, NOW);

		const chunks = [];
		for (let chunk = 0; chunk < 6; chunk += 1) {
			chunks.push(await service.advance(PUUID, NOW + chunk));
		}

		// The bug this guards: indexing twenty ids a chunk while fetching five
		// payloads takes the count up by fifteen a tick, so the reader watches a
		// number climb in front of a list that stays empty.
		//
		// The count is not monotonic — draining it to zero is what earns a page
		// deeper, and that page arrives as twenty more ids with no payloads — but
		// it sawtooths inside one page's worth, and every chunk puts games on
		// screen while it does.
		expect(chunks.every((chunk) => chunk.ingested > 0)).toBe(true);
		expect(
			Math.max(...chunks.map((chunk) => chunk.pending)),
		).toBeLessThanOrEqual(ACCOUNT_MATCH_PAGE_SIZE);
	});

	it("reaches the whole history over enough chunks, then reports itself done", async () => {
		await service.sync(PUUID, NOW);

		await advanceUntilDone();

		const held = await accountMatches.listMatchIds(accountId, {
			start: 0,
			count: 100,
		});
		expect(held).toHaveLength(history.length);
		expect(fetched).toHaveLength(history.length);
	});

	it("stays done once it is, without asking Riot again", async () => {
		await service.sync(PUUID, NOW);
		await advanceUntilDone();
		const callsToFinish = fetchMatchIds.mock.calls.length;

		const progress = await service.advance(PUUID, NOW + 1);

		expect(progress).toMatchObject({ indexed: 0, ingested: 0, done: true });
		expect(fetchMatchIds).toHaveBeenCalledTimes(callsToFinish);
	});

	it("keeps an id whose payload could not be fetched, rather than passing over it", async () => {
		await service.sync(PUUID, NOW);
		const saving = getMatchBody;
		getMatchBody = async () => {
			throw new Error("429 from Riot");
		};

		const failed = await service.advance(PUUID, NOW + 1);
		expect(failed.ingested).toBe(0);

		// The chunk stopped rather than skipping ahead, so the id it choked on is
		// still first in line.
		getMatchBody = saving;
		const retried = await service.advance(PUUID, NOW + 2);
		expect(retried.ingested).toBe(ACCOUNT_MATCH_INGEST_CHUNK);
		expect(fetched[0]).toBe("NA1_1030");
	});

	it("leaves the index readable while payloads are still missing", async () => {
		await service.sync(PUUID, NOW);

		const held = await accountMatches.listMatchIds(accountId, {
			start: 0,
			count: 100,
		});

		expect(held).toHaveLength(ACCOUNT_MATCH_PAGE_SIZE);
	});
});

describe("AccountMatchSyncService.status", () => {
	it("reports what is outstanding without touching Riot", async () => {
		await service.sync(PUUID, NOW);
		fetchMatchIds.mockClear();

		const status = await service.status(PUUID);

		expect(status).toEqual({
			pending: ACCOUNT_MATCH_PAGE_SIZE,
			backfillComplete: false,
		});
		expect(fetchMatchIds).not.toHaveBeenCalled();
	});

	it("lists an account with work left, so a restart resumes it", async () => {
		await service.sync(PUUID, NOW);

		expect(await service.listAccountsNeedingWork()).toEqual([PUUID]);
	});

	it("stops listing an account once it is finished", async () => {
		await service.sync(PUUID, NOW);
		await advanceUntilDone();

		expect(await service.listAccountsNeedingWork()).toEqual([]);
	});
});
