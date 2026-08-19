import { DatabaseSync } from "node:sqlite";

import { Global, Logger, Module } from "@nestjs/common";

import { DATABASE, DRIZZLE } from "./database.constant.ts";
import { applyConnectionPragmas } from "./db.utils.ts";
import { createDrizzle } from "./drizzle.ts";
import { runMigrations } from "./run-migrations.ts";

/**
 * Opens the SQLite file, then migrates it before handing the drizzle handle out
 * — repositories inject `DRIZZLE`, so making the migration part of building it
 * guarantees no query can run against a schema that is not up to date.
 *
 * Global so repositories in any feature module can inject it without each one
 * re-importing this module.
 */
@Global()
@Module({
	providers: [
		{
			provide: DATABASE,
			useFactory: () => {
				// Relative to the working directory, which is `backend/` for every
				// package script. Overridable so a test can point at ":memory:".
				const dbPath = process.env.DATABASE_PATH ?? "climb.db";
				const db = new DatabaseSync(dbPath);
				applyConnectionPragmas(db);
				return db;
			},
		},
		{
			provide: DRIZZLE,
			inject: [DATABASE],
			useFactory: async (database: DatabaseSync) => {
				const db = createDrizzle(database);

				const { applied } = await runMigrations(db, database);
				if (applied > 0) {
					new Logger("DatabaseModule").log(`Applied ${applied} migration(s)`);
				}

				return db;
			},
		},
	],
	exports: [DATABASE, DRIZZLE],
})
export class DatabaseModule {}
