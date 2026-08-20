import {
	Global,
	Inject,
	Logger,
	Module,
	type OnApplicationShutdown,
} from "@nestjs/common";
import pg from "pg";

import { DATABASE_POOL, DRIZZLE } from "./database.constant.ts";
import { createDrizzle } from "./drizzle.ts";
import { runMigrations } from "./run-migrations.ts";

/**
 * Opens the pool, then migrates before handing the drizzle handle out —
 * repositories inject `DRIZZLE`, so making the migration part of building it
 * guarantees no query can run against a schema that is not up to date.
 *
 * Global so repositories in any feature module can inject it without each one
 * re-importing this module.
 */
@Global()
@Module({
	providers: [
		{
			provide: DATABASE_POOL,
			useFactory: () => {
				const connectionString = process.env.DATABASE_URL;
				if (!connectionString) {
					throw new Error(
						"DATABASE_URL is not set. Start Postgres with scripts/postgres.sh and copy backend/.env.example.",
					);
				}
				return new pg.Pool({ connectionString });
			},
		},
		{
			provide: DRIZZLE,
			inject: [DATABASE_POOL],
			useFactory: async (pool: pg.Pool) => {
				const db = createDrizzle(pool);

				const { applied } = await runMigrations(db);
				if (applied > 0) {
					new Logger("DatabaseModule").log(`Applied ${applied} migration(s)`);
				}

				return db;
			},
		},
	],
	exports: [DATABASE_POOL, DRIZZLE],
})
export class DatabaseModule implements OnApplicationShutdown {
	private readonly pool: pg.Pool;

	constructor(@Inject(DATABASE_POOL) pool: pg.Pool) {
		this.pool = pool;
	}

	/**
	 * A pooled connection is an open socket, so without this the process keeps
	 * running after Nest has shut down and `pnpm dev`'s watcher cannot restart.
	 */
	async onApplicationShutdown() {
		await this.pool.end();
	}
}
