import { Test } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestDatabase } from "./../../../core/database/create-test-database.ts";
import { DRIZZLE } from "./../../../core/database/database.constant.ts";
import { RiotApiService } from "./../../../integrations/riot/riot-api.service.ts";
import { splitMatchId } from "./../../../lib/split-match-id.ts";
import { readMatchFixture } from "./../../matches/fixtures/read-match-fixture.ts";
import { MatchRepository } from "./../../matches/match.repository.ts";
import { AccountRepository } from "./../account.repository.ts";
import { AccountMatchRepository } from "./account-match.repository.ts";
import { AccountMatchService } from "./account-match.service.ts";

const PUUID = "puuid-1";
const NOW = 1_700_000_000_000;
const RANKED_SOLO = 420;
const ARAM = 450;

let accountId: number;
let service: AccountMatchService;
let accountMatches: AccountMatchRepository;
let matches: MatchRepository;
let riot: { fetchMatchIds: ReturnType<typeof vi.fn> };
let teardown: () => Promise<void>;

/** `count` ids counting down from `from`, in Riot's own newest-first order. */
const games = (from: number, count: number) =>
	Array.from({ length: count }, (_, offset) => `NA1_${from - offset}`);

/**
 * Saves a payload for `matchId` claiming to be `queueId`, which is the only way
 * a queue-filtered read can see the id at all — the queue is on the match, and
 * the index holds ids.
 */
const ingest = async (matchId: string, queueId: number) => {
	const dto = JSON.parse(readMatchFixture("queue-420-ranked-20260724"));
	dto.metadata.matchId = matchId;
	dto.info.queueId = queueId;
	dto.info.gameId = splitMatchId(matchId).gameId;
	// One participant rather than ten: these tests are about which ids come back,
	// and a full roster per match makes the fixture the slow part of the run.
	dto.info.participants = dto.info.participants.slice(0, 1);

	await matches.ingest({
		matchId,
		body: JSON.stringify(dto),
		dto,
		fetchedAt: NOW,
	});
};

beforeEach(async () => {
	const database = await createTestDatabase();
	teardown = database.teardown;
	riot = { fetchMatchIds: vi.fn() };

	const moduleRef = await Test.createTestingModule({
		providers: [
			AccountMatchService,
			AccountMatchRepository,
			AccountRepository,
			MatchRepository,
		],
	})
		.useMocker((token) => {
			if (token === DRIZZLE) return database.db;
			if (token === RiotApiService) return riot;
		})
		.compile();

	service = moduleRef.get(AccountMatchService);
	accountMatches = moduleRef.get(AccountMatchRepository);
	matches = moduleRef.get(MatchRepository);

	const account = await moduleRef.get(AccountRepository).upsert(
		{
			puuid: PUUID,
			gameName: "Sneaky",
			tagLine: "NA69",
			region: "americas",
		},
		NOW,
	);
	accountId = account.id;
});

afterEach(() => teardown());

describe("AccountMatchService.getMatchIds", () => {
	it("serves the window out of the index, newest first", async () => {
		await accountMatches.insertIds(accountId, games(1030, 10), NOW);

		const window = await service.getMatchIds(PUUID, { start: 0, count: 5 });

		expect(window).toEqual(games(1030, 5));
	});

	it("never calls Riot, however deep the window asked for", async () => {
		await accountMatches.insertIds(accountId, games(1030, 5), NOW);

		const window = await service.getMatchIds(PUUID, { start: 0, count: 50 });

		// Short, and that is the whole contract: the index holds five, so five come
		// back. Filling it is a sync's job, and a read must not go looking.
		expect(window).toHaveLength(5);
		expect(riot.fetchMatchIds).not.toHaveBeenCalled();
	});

	it("serves an account nothing has synced as empty rather than fetching it", async () => {
		const window = await service.getMatchIds("puuid-nobody-has-synced", {
			start: 0,
			count: 10,
		});

		expect(window).toEqual([]);
		expect(riot.fetchMatchIds).not.toHaveBeenCalled();
	});

	it("pages by cursor without repeating", async () => {
		await accountMatches.insertIds(accountId, games(1030, 20), NOW);

		const first = await service.getMatchIds(PUUID, { start: 0, count: 10 });
		const second = await service.getMatchIds(PUUID, {
			beforeGameId: 1021,
			start: 0,
			count: 10,
		});

		expect(first).toEqual(games(1030, 10));
		expect(second).toEqual(games(1020, 10));
	});

	it("keeps ids with no payload when no queue was asked for", async () => {
		await accountMatches.insertIds(accountId, games(1030, 3), NOW);
		await ingest("NA1_1030", RANKED_SOLO);

		const window = await service.getMatchIds(PUUID, { start: 0, count: 10 });

		// Two of the three have never been fetched. An unfiltered read is about the
		// history, not about what has been read of it.
		expect(window).toEqual(games(1030, 3));
	});

	it("serves only the asked-for queue when one is given", async () => {
		await accountMatches.insertIds(accountId, games(1030, 4), NOW);
		await ingest("NA1_1030", RANKED_SOLO);
		await ingest("NA1_1029", ARAM);
		await ingest("NA1_1028", RANKED_SOLO);

		const window = await service.getMatchIds(PUUID, {
			queueId: RANKED_SOLO,
			start: 0,
			count: 10,
		});

		// NA1_1027 is indexed but unfetched, so nothing knows it is ranked — it is
		// left out rather than assumed in.
		expect(window).toEqual(["NA1_1030", "NA1_1028"]);
		expect(riot.fetchMatchIds).not.toHaveBeenCalled();
	});

	it("pages a filtered window by cursor the same way", async () => {
		await accountMatches.insertIds(accountId, games(1030, 6), NOW);
		for (const [offset, queue] of [
			RANKED_SOLO,
			ARAM,
			RANKED_SOLO,
			RANKED_SOLO,
			ARAM,
			RANKED_SOLO,
		].entries()) {
			await ingest(`NA1_${1030 - offset}`, queue);
		}

		const first = await service.getMatchIds(PUUID, {
			queueId: RANKED_SOLO,
			start: 0,
			count: 2,
		});
		const second = await service.getMatchIds(PUUID, {
			queueId: RANKED_SOLO,
			beforeGameId: 1028,
			start: 0,
			count: 2,
		});

		expect(first).toEqual(["NA1_1030", "NA1_1028"]);
		expect(second).toEqual(["NA1_1027", "NA1_1025"]);
	});
});
