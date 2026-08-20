import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit reads the schema and writes SQL into `src/core/database/migrations/`.
 * The credentials are only needed by `push`/`studio`; `generate` never opens a
 * connection, and the app applies the generated files itself at boot.
 */
export default defineConfig({
	dialect: "postgresql",
	// A glob, so adding a table is adding a file — nothing here to update.
	schema: "./src/core/database/models/*.model.ts",
	out: "./src/core/database/migrations",
	dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
