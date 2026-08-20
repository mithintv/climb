import { describe, expect, it } from "vitest";

import { parseRetryAfter } from "./http-client.service.ts";

describe("parseRetryAfter", () => {
	it("reads a delay in seconds", () => {
		expect(parseRetryAfter("30")).toBe(30);
	});

	it("rounds a fractional delay up, so the caller never returns early", () => {
		expect(parseRetryAfter("1.2")).toBe(2);
	});

	it("treats zero as a real answer rather than a missing one", () => {
		// Distinct from null: the upstream said the limit is already clear, which
		// is not the same as it saying nothing.
		expect(parseRetryAfter("0")).toBe(0);
	});

	it("gives up on the HTTP-date form rather than trusting a clock", () => {
		expect(parseRetryAfter("Wed, 21 Oct 2026 07:28:00 GMT")).toBeNull();
	});

	it("gives up on an absent or unusable header", () => {
		expect(parseRetryAfter(undefined)).toBeNull();
		expect(parseRetryAfter("")).toBeNull();
		expect(parseRetryAfter("-5")).toBeNull();
		// A repeated header arrives as an array, which is not a delay.
		expect(parseRetryAfter(["1", "2"])).toBeNull();
	});
});
