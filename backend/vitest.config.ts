import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// Repository tests run against the real Postgres, so they need the same
// DATABASE_URL the app does. The path is resolved from this file because the
// working directory is `backend/` for `pnpm --filter backend test` and the repo
// root for `pnpm test`, and dotenv would find nothing there.
const { parsed } = config({
	path: fileURLToPath(new URL(".env", import.meta.url)),
	quiet: true,
});

export default defineConfig({
	test: {
		// No explicit root: it defaults to this file's directory, and setting it
		// broke discovery when the root config loads this as a project.
		include: ["src/**/*.test.ts"],
		environment: "node",
		// Passed explicitly rather than relying on the workers inheriting what
		// dotenv put on this process.
		env: parsed,
	},
	// vitest's default transformer is esbuild, which honours decorators but
	// cannot emit `design:paramtypes` — so Nest's DI could not resolve a
	// constructor by type and tests had to build their subjects with `new`. swc
	// emits the metadata, so tests can go through the real container and a
	// provider missing from a module fails here rather than at boot.
	plugins: [
		swc.vite({
			module: { type: "es6" },
			jsc: {
				parser: { syntax: "typescript", decorators: true },
				transform: { legacyDecorator: true, decoratorMetadata: true },
				target: "es2022",
			},
		}),
	],
});
