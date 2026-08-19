import { defineConfig } from "vitest/config";

/**
 * The root only assembles the workspace's test projects. Each package keeps its
 * own config — `backend/vitest.config.ts`, and `frontend/vite.config.ts` by
 * fallback — so `pnpm --filter <pkg> test` still runs that package alone.
 *
 * This file exists so both are discoverable from the repo root: `pnpm test`
 * runs everything, and editor extensions find a config where the folder was
 * opened rather than only inside a package.
 */
export default defineConfig({
	test: {
		projects: ["backend", "frontend"],
	},
});
