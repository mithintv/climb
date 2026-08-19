import { describe, expect, it } from "vitest";

import { readMatchFixture } from "./fixtures/read-match-fixture.ts";
import {
	PROJECTION_VERSION,
	projectMatch,
	projectParticipants,
} from "./match-projection.utils.ts";
import type { IRiotMatchDto } from "./types/i-riot-match-dto.type.ts";

const fixture = (name: string) =>
	JSON.parse(readMatchFixture(name)) as IRiotMatchDto;

const CASES = [
	// The ranked payload carries the current participant fields — `roleBoundItem`
	// present, `bountyLevel` gone. The Arena one predates that patch and has the
	// reverse, so between them they cover both field sets Riot has served.
	["queue-420-ranked-20260724", "NA1_5607525822", 10],
	["queue-1700-arena-20250414", "NA1_5266526620", 16],
] as const;

describe("projectMatch", () => {
	it.each(CASES)("projects %s without throwing", (name, matchId, count) => {
		const dto = fixture(name);

		const match = projectMatch(matchId, dto);

		expect(match.platformId).toBe("NA1");
		expect(match.gameId).toBe(Number(matchId.split("_")[1]));
		expect(match.gameId).toBe(dto.info?.gameId);
		expect(match.projectionVersion).toBe(PROJECTION_VERSION);
		expect(projectParticipants(dto)).toHaveLength(count);
	});

	it("takes the platform and game id from the match id, not the payload", () => {
		// `match_id` is exactly `platform_id + "_" + game_id`, and it is the value
		// the caller asked for — `info.platformId` is only Riot's copy of it.
		const match = projectMatch("NA1_5607525822", {
			info: { platformId: "EUW1", gameId: 1 },
		});

		expect(match.platformId).toBe("NA1");
		expect(match.gameId).toBe(5_607_525_822);
	});

	it("rejects something that is not a match id", () => {
		expect(() => projectMatch("5607525822", {})).toThrow(/Not a match id/);
	});

	it("projects an empty payload to nulls rather than throwing", () => {
		// The rule the whole design rests on: ingest must never fail because the
		// projection came back empty. The blob is stored either way.
		const match = projectMatch("NA1_1", {});

		expect(match.queueId).toBeNull();
		expect(match.gameMode).toBeNull();
		expect(match.endOfGameResult).toBeNull();
		expect(projectParticipants({})).toEqual([]);
	});
});

describe("projectParticipants", () => {
	it("keeps Riot's order, since the index is half the row's identity", () => {
		const dto = fixture("queue-420-ranked-20260724");

		const rows = projectParticipants(dto);

		expect(rows.map((row) => row.participantIndex)).toEqual([
			0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
		]);
		// `metadata.participants` is the same puuids in the same order, which is
		// why it is not stored — and it makes an independent check of the ordering.
		expect(rows.map((row) => row.puuid)).toEqual(dto.metadata?.participants);
		expect(rows[0].championName).toBe("Viktor");
		expect(rows[0].teamPosition).toBe("TOP");
		expect(rows[0].win).toBe(true);
	});

	it("pulls the trees and the keystone out of perks.styles", () => {
		const [row] = projectParticipants(fixture("queue-420-ranked-20260724"));

		expect(row.perkPrimaryStyle).toBe(8200);
		expect(row.perkKeystone).toBe(8992);
		expect(row.perkSubStyle).toBe(8400);
	});

	it("falls back to the order of perks.styles when the labels are absent", () => {
		const [row] = projectParticipants({
			info: {
				participants: [
					{
						puuid: "puuid-00",
						perks: {
							styles: [
								{ style: 8100, selections: [{ perk: 8112 }] },
								{ style: 8200, selections: [{ perk: 8226 }] },
							],
						},
					},
				],
			},
		});

		expect(row.perkPrimaryStyle).toBe(8100);
		expect(row.perkKeystone).toBe(8112);
		expect(row.perkSubStyle).toBe(8200);
	});

	it("projects Arena, where there are no lanes and everyone has a placement", () => {
		const rows = projectParticipants(fixture("queue-1700-arena-20250414"));

		expect(rows).toHaveLength(16);
		// Empty rather than absent: Arena reports the field and leaves it blank.
		expect(rows.every((row) => row.teamPosition === "")).toBe(true);
		// Eight duos, so every place is taken twice — and not in participant order.
		expect(
			rows.map((row) => row.placement).sort((a, b) => Number(a) - Number(b)),
		).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8]);
		// Participants split 100/200 while `info.teams` reports 100 and 0, so the
		// two do not line up and nothing here derives a side from either.
		expect(new Set(rows.map((row) => row.teamId))).toEqual(new Set([100, 200]));
	});

	it("stores Arena's empty rune trees as the zeroes Riot sends", () => {
		// Arena players have no runes at all: every `perks.styles` entry comes back
		// with `style: 0` and a first selection of 0. Documented because it reads
		// like missing data and is not — the payload really says zero.
		const [row] = projectParticipants(fixture("queue-1700-arena-20250414"));

		expect(row.perkPrimaryStyle).toBe(0);
		expect(row.perkKeystone).toBe(0);
		expect(row.perkSubStyle).toBe(0);
	});

	it("leaves placement null outside Arena, where Riot reports 0", () => {
		// 0 is not a placement, and storing it would make the column mean two
		// things — "eighth" and "this queue has no placements" — at once.
		const rows = projectParticipants(fixture("queue-420-ranked-20260724"));

		expect(rows.every((row) => row.placement === null)).toBe(true);
	});

	it("nulls a participant's missing columns instead of throwing", () => {
		// A patch that removes a field — `bountyLevel` went this way — must not be
		// able to fail an ingest.
		const [row] = projectParticipants({
			info: { participants: [{ puuid: "puuid-00" }] },
		});

		expect(row.championName).toBeNull();
		expect(row.kills).toBeNull();
		expect(row.perkKeystone).toBeNull();
		expect(row.puuid).toBe("puuid-00");
	});

	it("drops a participant with no puuid, which is the column reads filter on", () => {
		const rows = projectParticipants({
			info: { participants: [{ puuid: "puuid-00" }, { championId: 64 }] },
		});

		expect(rows).toHaveLength(1);
		expect(rows[0].participantIndex).toBe(0);
	});
});
