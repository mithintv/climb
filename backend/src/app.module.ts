import { Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";

import { DatabaseModule } from "./core/database/database.module.ts";
import { logger } from "./core/logging/logger.ts";
import { AccountMatchModule } from "./features/account-matches/account-match.module.ts";
import { AccountModule } from "./features/accounts/account.module.ts";
import { MatchModule } from "./features/matches/match.module.ts";

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
		AccountMatchModule,
		MatchModule,
	],
})
export class AppModule {}
