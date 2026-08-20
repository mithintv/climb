import { Test } from "@nestjs/testing";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestDatabase } from "./../../core/database/create-test-database.ts";
import { DRIZZLE } from "./../../core/database/database.constant.ts";
import type { Drizzle } from "./../../core/database/drizzle.ts";
import { gameMaps } from "./../../core/database/models/game-maps.model.ts";
import { gameModes } from "./../../core/database/models/game-modes.model.ts";
import { gamePlatforms } from "./../../core/database/models/game-platforms.model.ts";
import { gameQueues } from "./../../core/database/models/game-queues.model.ts";
import { gameTypes } from "./../../core/database/models/game-types.model.ts";
import { matchParticipantPerks } from "./../../core/database/models/match-participant-perks.model.ts";
import { matchParticipants } from "./../../core/database/models/match-participants.model.ts";
import { matches } from "./../../core/database/models/matches.model.ts";
import { patches } from "./../../core/database/models/patches.model.ts";
import { perks } from "./../../core/database/models/perks.model.ts";
import { readMatchFixture } from "./fixtures/read-match-fixture.ts";
import { MatchRepository } from "./match.repository.ts";
import { decodeMatchPayload } from "./match-payload.utils.ts";
import type { IRiotMatchDto } from "./types/i-riot-match-dto.type.ts";
import {
	UNKNOWN_GAME_MODE,
	UNKNOWN_GAME_TYPE,
	UNKNOWN_MAP_ID,
	UNKNOWN_PATCH,
	UNKNOWN_QUEUE_ID,
} from "./unknown-lookup-row.constant.ts";

const RANKED_MATCH_ID = "NA1_5607525822";
const ARENA_MATCH_ID = "NA1_5266526620";

let repository: MatchRepository;
let db: Drizzle;
let teardown: () => Promise<void>;

beforeEach(async () => {
	({ db, teardown } = await createTestDatabase());

	// Resolved through Nest's container, over a real database — only the drizzle
	// handle is supplied.
	const moduleRef = await Test.createTestingModule({
		providers: [MatchRepository, { provide: DRIZZLE, useValue: db }],
	}).compile();

	repository = moduleRef.get(MatchRepository);
});

afterEach(() => teardown());

/** A fixture packaged the way the service hands one to the repository. */
const toStore = (matchId: string, name: string, fetchedAt = 1000) => {
	const body = readMatchFixture(name);
	return { matchId, body, dto: JSON.parse(body) as IRiotMatchDto, fetchedAt };
};

const rowFor = async (matchId: string) => {
	const [row] = await db
		.select()
		.from(matches)
		.where(eq(matches.matchId, matchId));
	return row;
};

describe("MatchRepository.ingest", () => {
	it("stores the payload and its participants together", async () => {
		const { stored } = await repository.ingest(
			toStore(RANKED_MATCH_ID, "queue-420-ranked-20260724"),
		);

		expect(stored).toBe(true);
		const row = await rowFor(RANKED_MATCH_ID);
		expect(row.platformId).toBe("NA1");
		expect(row.gameId).toBe(5_607_525_822);
		expect(row.queueId).toBe(420);
		expect(row.fetchedAt).toBe(1000);
		expect(
			await db
				.select()
				.from(matchParticipants)
				.where(eq(matchParticipants.matchRowId, row.id)),
		).toHaveLength(10);
	});

	it("returns the payload byte for byte through the database", async () => {
		// bytea is the load-bearing column type here: a text column would have to
		// pick an encoding, and jsonb would reorder the keys.
		const match = toStore(ARENA_MATCH_ID, "queue-1700-arena-20250414");
		await repository.ingest(match);

		const stored = await repository.findPayload(ARENA_MATCH_ID);

		expect(decodeMatchPayload(stored.payload, stored.payloadEncoding)).toBe(
			match.body,
		);
	});

	it("stores a payload carrying fields this build knows nothing about", async () => {
		// The projection is allowed to lag Riot by a patch; ingest is not.
		const body = JSON.stringify({
			metadata: { matchId: "NA1_9", dataVersion: "3" },
			info: {
				queueId: 420,
				somethingRiotAddedLater: { nested: true },
				participants: [
					{ puuid: "puuid-00", championName: "Ahri", newFieldPerPlayer: 42 },
				],
			},
		});

		const { stored } = await repository.ingest({
			matchId: "NA1_9",
			body,
			dto: JSON.parse(body) as IRiotMatchDto,
			fetchedAt: 2000,
		});

		expect(stored).toBe(true);
		const payload = await repository.findPayload("NA1_9");
		expect(
			JSON.parse(decodeMatchPayload(payload.payload, payload.payloadEncoding)),
		).toEqual(JSON.parse(body));
	});

	it("computes match_id from the platform and game id", async () => {
		// The column is GENERATED ALWAYS, so nothing inserts it — the database
		// derives it, and the three can never disagree.
		await repository.ingest(
			toStore(RANKED_MATCH_ID, "queue-420-ranked-20260724"),
		);

		const row = await rowFor(RANKED_MATCH_ID);

		expect(row.matchId).toBe(`${row.platformId}_${row.gameId}`);
		expect(row.matchId).toBe(RANKED_MATCH_ID);
	});

	it("resolves every lookup to a row, reusing them across matches", async () => {
		await repository.ingest(
			toStore(RANKED_MATCH_ID, "queue-420-ranked-20260724"),
		);
		await repository.ingest(
			toStore(ARENA_MATCH_ID, "queue-1700-arena-20250414"),
		);

		expect(
			(await db.select().from(gameModes)).map((row) => row.mode).sort(),
		).toEqual(["CHERRY", "CLASSIC"]);
		expect((await db.select().from(gameTypes)).map((row) => row.type)).toEqual([
			"MATCHED_GAME",
		]);
		// Numeric sort: the default one is lexicographic, which puts 1700 before 420.
		expect(
			(await db.select().from(gameQueues))
				.map((row) => row.id)
				.sort((a, b) => a - b),
		).toEqual([420, 1700]);
		expect(
			(await db.select().from(gameMaps))
				.map((row) => row.id)
				.sort((a, b) => a - b),
		).toEqual([11, 30]);
		expect(
			(await db.select().from(gamePlatforms)).map((row) => row.id),
		).toEqual(["NA1"]);
		expect(
			(await db.select().from(patches))
				.map((row) => `${row.major}.${row.minor}`)
				.sort(),
		).toEqual(["15.7", "16.14"]);

		// A third match on a patch and platform already seen must reuse those rows
		// rather than adding more.
		await repository.ingest({
			...toStore(RANKED_MATCH_ID, "queue-420-ranked-20260724"),
			matchId: "NA1_5607525823",
		});
		expect(await db.select().from(patches)).toHaveLength(2);
		expect(await db.select().from(gamePlatforms)).toHaveLength(1);
	});

	it("ingests a payload that names no queue, map, mode, type or patch", async () => {
		// Those five columns are NOT NULL, so without the "unknown" rows this
		// insert would fail and the payload — the thing worth keeping — would be
		// lost. The platform is exempt: it comes from the match id, not the body.
		const body = JSON.stringify({ info: { participants: [] } });

		const { stored } = await repository.ingest({
			matchId: "NA1_7",
			body,
			dto: JSON.parse(body) as IRiotMatchDto,
			fetchedAt: 1000,
		});

		expect(stored).toBe(true);
		const [mode] = await db.select().from(gameModes);
		const [type] = await db.select().from(gameTypes);
		const [queue] = await db.select().from(gameQueues);
		const [map] = await db.select().from(gameMaps);
		const [patch] = await db.select().from(patches);

		expect(mode.mode).toBe(UNKNOWN_GAME_MODE);
		expect(type.type).toBe(UNKNOWN_GAME_TYPE);
		expect(queue.id).toBe(UNKNOWN_QUEUE_ID);
		expect(map.id).toBe(UNKNOWN_MAP_ID);
		expect({ major: patch.major, minor: patch.minor }).toEqual(UNKNOWN_PATCH);
		expect((await rowFor("NA1_7")).platformId).toBe("NA1");
	});

	it("writes nine perk rows per participant and a perks row for each id", async () => {
		await repository.ingest(
			toStore(RANKED_MATCH_ID, "queue-420-ranked-20260724"),
		);

		const rows = await db.select().from(matchParticipantPerks);
		expect(rows).toHaveLength(90); // 10 participants x 9 picks

		const [participant] = await db
			.select()
			.from(matchParticipants)
			.where(eq(matchParticipants.participantIndex, 0));
		const mine = rows
			.filter((row) => row.matchParticipantId === participant.id)
			.sort((a, b) => a.id - b.id);

		expect(mine.map((row) => `${row.kind}${row.slot}`)).toEqual([
			"PRIMARY0",
			"PRIMARY1",
			"PRIMARY2",
			"PRIMARY3",
			"SECONDARY0",
			"SECONDARY1",
			"STAT0",
			"STAT1",
			"STAT2",
		]);
		// The keystone is slot 0 of the primary tree.
		expect(mine[0].perkId).toBe(8992);
		expect(mine[0].styleId).toBe(8200);
		// Stat shards belong to no tree.
		expect(mine.slice(6).every((row) => row.styleId === null)).toBe(true);

		// Every id referenced has a row to point at, created by ingest even though
		// nothing has seeded the table in this test.
		const known = new Set((await db.select().from(perks)).map((row) => row.id));
		expect(
			rows.every(
				(row) =>
					known.has(row.perkId) &&
					(row.styleId === null || known.has(row.styleId)),
			),
		).toBe(true);
	});

	it("writes Arena's zero perks rather than failing on an unknown rune", async () => {
		// Arena reports style 0 and perk 0 throughout. There is no perk 0 in Data
		// Dragon, so without ingest creating the row the foreign key would reject
		// the whole match.
		await repository.ingest(
			toStore(ARENA_MATCH_ID, "queue-1700-arena-20250414"),
		);

		const rows = await db.select().from(matchParticipantPerks);

		expect(rows).toHaveLength(144); // 16 participants x 9
		expect(rows.every((row) => row.perkId === 0)).toBe(true);
		expect((await db.select().from(perks)).map((row) => row.id)).toEqual([0]);
	});

	it("does nothing on a second ingest of the same match", async () => {
		// Two requests for the same unsaved match race across pooled connections,
		// and a completed match is immutable — so the loser has nothing to do.
		const first = toStore(RANKED_MATCH_ID, "queue-420-ranked-20260724");
		await repository.ingest(first);

		const second = await repository.ingest(
			toStore(RANKED_MATCH_ID, "queue-420-ranked-20260724", 9999),
		);

		expect(second.stored).toBe(false);
		expect(await db.select().from(matches)).toHaveLength(1);
		expect(await db.select().from(matchParticipants)).toHaveLength(10);
		expect((await rowFor(RANKED_MATCH_ID)).fetchedAt).toBe(1000);
	});

	it("stores no match row when the participants cannot be written", async () => {
		// The transaction is what keeps a match from existing without its
		// participants. A duplicate index forces the second statement to fail.
		const twice = { puuid: "puuid-00" };
		await db.execute(
			"CREATE UNIQUE INDEX one_row_per_puuid ON match_participants (puuid)",
		);

		await expect(
			repository.ingest({
				matchId: RANKED_MATCH_ID,
				body: "{}",
				dto: { info: { participants: [twice, twice] } },
				fetchedAt: 1000,
			}),
		).rejects.toThrow();

		expect(await db.select().from(matches)).toHaveLength(0);
	});
});

describe("MatchRepository.findPayload", () => {
	it("returns undefined for a match that has not been ingested", async () => {
		expect(await repository.findPayload(RANKED_MATCH_ID)).toBeUndefined();
	});
});
