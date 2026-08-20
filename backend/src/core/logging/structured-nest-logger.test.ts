import type { Logger } from "nestjs-pino";
import { describe, expect, it, vi } from "vitest";

import { StructuredNestLogger } from "./structured-nest-logger.ts";

/**
 * Fills a rewritten template the way the pretty renderer in `logger.ts` does,
 * so a rule can be checked against the line the console will print.
 */
const render = (record: Record<string, unknown>) =>
	String(record.msg).replace(/\{([\w.]+)\}/g, (placeholder, path: string) => {
		const value = record[path];
		return value === undefined ? placeholder : String(value);
	});

/** Logs `message` through the wrapper and returns what reached nestjs-pino. */
const capture = (message: string) => {
	const log = vi.fn();
	new StructuredNestLogger({ log } as unknown as Logger).log(
		message,
		"InstanceLoader",
	);
	return log.mock.calls[0]?.[0];
};

describe("StructuredNestLogger", () => {
	it("splits a module init line into a module field", () => {
		const record = capture("AccountModule dependencies initialized");

		expect(record).toMatchObject({ module: "AccountModule" });
		expect(render(record)).toBe("AccountModule dependencies initialized");
	});

	it("splits a controller line into a controller and a path", () => {
		const record = capture("AccountController {/accounts}:");

		expect(record).toMatchObject({
			controller: "AccountController",
			path: "/accounts",
		});
		expect(render(record)).toBe("AccountController mapped to /accounts");
	});

	it("splits a versioned controller line into its version too", () => {
		const record = capture("AccountController {/accounts} (version: 1):");

		expect(record).toMatchObject({
			controller: "AccountController",
			path: "/accounts",
			version: "1",
		});
		expect(render(record)).toBe(
			"AccountController mapped to /accounts (version: 1)",
		);
	});

	it("splits a mapped route into a path and a method", () => {
		const record = capture("Mapped {/accounts/:puuid/matches, GET} route");

		expect(record).toMatchObject({
			path: "/accounts/:puuid/matches",
			method: "GET",
		});
		expect(render(record)).toBe("Mapped GET /accounts/:puuid/matches route");
	});

	it("splits a versioned mapped route into its version too", () => {
		const record = capture("Mapped {/accounts, GET} (version: 1,2) route");

		expect(record).toMatchObject({
			path: "/accounts",
			method: "GET",
			version: "1,2",
		});
		expect(render(record)).toBe("Mapped GET /accounts route (version: 1,2)");
	});

	it("passes a message matching no rule through untouched", () => {
		expect(capture("Nest application successfully started")).toBe(
			"Nest application successfully started",
		);
	});

	// Seq reads `{{` as an escaped literal brace and stops substituting, so a
	// template carrying one renders as prose there while the console still looks
	// right — the failure the plain wording above exists to avoid.
	it("never emits a template Seq would read as an escaped brace", () => {
		const messages = [
			"AccountModule dependencies initialized",
			"AccountController {/accounts}:",
			"AccountController {/accounts} (version: 1):",
			"Mapped {/accounts, GET} route",
			"Mapped {/accounts, GET} (version: 1) route",
		];

		for (const message of messages) {
			expect(String(capture(message).msg)).not.toMatch(/\{\{|\}\}/);
		}
	});
});
