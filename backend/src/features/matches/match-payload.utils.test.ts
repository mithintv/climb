import { describe, expect, it } from "vitest";

import { readMatchFixture } from "./fixtures/read-match-fixture.ts";
import {
	decodeMatchPayload,
	encodeMatchPayload,
	MATCH_PAYLOAD_ENCODING,
} from "./match-payload.utils.ts";

const FIXTURES = ["queue-420-ranked-20260724", "queue-1700-arena-20250414"];

describe("encodeMatchPayload / decodeMatchPayload", () => {
	it.each(FIXTURES)("returns %s byte for byte", (name) => {
		const body = readMatchFixture(name);

		const { payload, payloadEncoding } = encodeMatchPayload(body);

		// Byte-exact, not deep-equal: the whole reason the payload is a compressed
		// blob rather than `jsonb` is that a caller gets back what Riot sent, key
		// order and number formatting included.
		expect(decodeMatchPayload(payload, payloadEncoding)).toBe(body);
	});

	it("round-trips a field this build knows nothing about", () => {
		// The contract the blob exists to keep: a participant key Riot adds next
		// patch survives storage without any code here being taught about it.
		const body = JSON.stringify({
			metadata: { matchId: "NA1_1", participants: ["puuid-00"] },
			info: {
				participants: [{ puuid: "puuid-00", somethingRiotAddedLater: 7 }],
			},
		});

		const { payload, payloadEncoding } = encodeMatchPayload(body);

		expect(JSON.parse(decodeMatchPayload(payload, payloadEncoding))).toEqual(
			JSON.parse(body),
		);
	});

	it("records the decoded length, not the stored one", () => {
		const body = readMatchFixture("queue-420-ranked-20260724");

		const { payload, payloadBytes } = encodeMatchPayload(body);

		expect(payloadBytes).toBe(Buffer.byteLength(body, "utf8"));
		expect(payload.byteLength).toBeLessThan(payloadBytes);
	});

	it("refuses to decode an encoding it does not know", () => {
		// A row written by a newer deploy. Failing is better than handing back
		// bytes decoded as something they are not.
		const { payload } = encodeMatchPayload("{}");

		expect(() => decodeMatchPayload(payload, "zstd")).toThrow(
			/Unsupported match payload encoding/,
		);
		expect(MATCH_PAYLOAD_ENCODING).toBe("gzip");
	});
});
