import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit only ever reads the schema and writes SQL into `src/core/database/migrations/` — it is
 * never pointed at the database. `push` and `studio` would need a driver it has
 * no adapter for (the app runs drizzle over `node:sqlite` through the proxy
 * dialect), so migrations are generated here and applied by the app at boot.
 */
export default defineConfig({
	dialect: "sqlite",
	schema: "./src/core/database/schema.ts",
	out: "./src/core/database/migrations",
});
