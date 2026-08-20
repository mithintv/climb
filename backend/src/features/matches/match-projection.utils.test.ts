import { describe, expect, it } from "vitest";

import { readMatchFixture } from "./fixtures/read-match-fixture.ts";
import {
	PROJECTION_VERSION,
	parseGameVersion,
	projectMatch,
	projectParticipantPerks,
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
		expect(match.patch).toBeNull();
		expect(match.endOfGameResult).toBeNull();
		expect(projectParticipants({})).toEqual([]);
	});

	it("hands the mode and patch over raw, for the repository to resolve", () => {
		// Both are rows in other tables, so the projection stays a pure function of
		// the payload and does not reach for the database to turn them into ids.
		const ranked = projectMatch(
			"NA1_5607525822",
			fixture("queue-420-ranked-20260724"),
		);
		const arena = projectMatch(
			"NA1_5266526620",
			fixture("queue-1700-arena-20250414"),
		);

		expect(ranked.gameMode).toBe("CLASSIC");
		expect(ranked.patch).toEqual({ major: 16, minor: 14 });
		expect(arena.gameMode).toBe("CHERRY");
		expect(arena.patch).toEqual({ major: 15, minor: 7 });
	});
});

describe("parseGameVersion", () => {
	it("keeps only the patch, dropping the build", () => {
		// "16.14.794.9266" is patch 16.14 built 794.9266, and one patch ships
		// several builds — so the build is not what a match should be grouped by.
		expect(parseGameVersion("16.14.794.9266")).toEqual({
			major: 16,
			minor: 14,
		});
	});

	it("returns numbers, so 16.9 orders before 16.14", () => {
		const early = parseGameVersion("16.9.1.2");
		const late = parseGameVersion("16.14.1.2");

		expect(Number(early?.minor) < Number(late?.minor)).toBe(true);
	});

	it.each([undefined, "", "16", "sixteen.fourteen", "16.x.1"])(
		"returns null for %s rather than failing an ingest",
		(version) => {
			expect(parseGameVersion(version)).toBeNull();
		},
	);
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

describe("projectParticipantPerks", () => {
	it("projects nine picks: four primary, two secondary, three shards", () => {
		const [first] = projectParticipantPerks(
			fixture("queue-420-ranked-20260724"),
		);

		expect(first.participantIndex).toBe(0);
		expect(first.picks).toEqual([
			{ kind: "PRIMARY", slot: 0, styleId: 8200, perkId: 8992 },
			{ kind: "PRIMARY", slot: 1, styleId: 8200, perkId: 8226 },
			{ kind: "PRIMARY", slot: 2, styleId: 8200, perkId: 8234 },
			{ kind: "PRIMARY", slot: 3, styleId: 8200, perkId: 8237 },
			{ kind: "SECONDARY", slot: 0, styleId: 8400, perkId: 8473 },
			{ kind: "SECONDARY", slot: 1, styleId: 8400, perkId: 8401 },
			// Riot's own key order — offense, flex, defense — is the slot order.
			{ kind: "STAT", slot: 0, styleId: null, perkId: 5005 },
			{ kind: "STAT", slot: 1, styleId: null, perkId: 5010 },
			{ kind: "STAT", slot: 2, styleId: null, perkId: 5001 },
		]);
	});

	it("keeps Arena's zeroes rather than dropping the picks", () => {
		// Arena players have no runes: every style, selection and shard is 0. A
		// dropped row and a deliberate zero would otherwise look the same.
		const [first] = projectParticipantPerks(
			fixture("queue-1700-arena-20250414"),
		);

		expect(first.picks).toHaveLength(9);
		expect(first.picks.every((pick) => pick.perkId === 0)).toBe(true);
		expect(
			first.picks
				.filter((pick) => pick.kind !== "STAT")
				.every((pick) => pick.styleId === 0),
		).toBe(true);
	});

	it("falls back to the order of perks.styles when the labels are absent", () => {
		const [first] = projectParticipantPerks({
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

		expect(first.picks).toEqual([
			{ kind: "PRIMARY", slot: 0, styleId: 8100, perkId: 8112 },
			{ kind: "SECONDARY", slot: 0, styleId: 8200, perkId: 8226 },
		]);
	});

	it("projects no picks at all rather than throwing on a payload without perks", () => {
		const [first] = projectParticipantPerks({
			info: { participants: [{ puuid: "puuid-00" }] },
		});

		expect(first.picks).toEqual([]);
	});
});
