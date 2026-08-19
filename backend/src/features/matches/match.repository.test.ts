import { Test } from "@nestjs/testing";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestDatabase } from "./../../core/database/create-test-database.ts";
import { DRIZZLE } from "./../../core/database/database.constant.ts";
import type { Drizzle } from "./../../core/database/drizzle.ts";
import { matchParticipants } from "./../../core/database/models/match-participants.model.ts";
import { matches } from "./../../core/database/models/matches.model.ts";
import { readMatchFixture } from "./fixtures/read-match-fixture.ts";
import { MatchRepository } from "./match.repository.ts";
import { decodeMatchPayload } from "./match-payload.utils.ts";
import type { IRiotMatchDto } from "./types/i-riot-match-dto.type.ts";

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
