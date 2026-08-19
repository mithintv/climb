import { Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";

import { AccountModule } from "./accounts/account.module.ts";
import { DatabaseModule } from "./database/database.module.ts";
import { logger } from "./logging/logger.ts";
import { MatchModule } from "./matches/match.module.ts";

@Module({
	imports: [
		// Reuses the existing pino instance, so Seq and the {placeholder} message
		// templates keep working and Nest's own logs go through the same streams.
		LoggerModule.forRoot({
			pinoHttp: {
				logger,
				customSuccessMessage: () =>
					"{req.method} {req.url} -> {res.statusCode} ({responseTime}ms)",
				customErrorMessage: () =>
					"{req.method} {req.url} -> {res.statusCode} (errored)",
			},
		}),
		DatabaseModule,
		AccountModule,
		MatchModule,
	],
})
export class AppModule {}
