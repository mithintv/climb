import "reflect-metadata";
import "dotenv/config";

import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module.ts";
import { RiotExceptionFilter } from "./common/riot-exception.filter.ts";

const bootstrap = async () => {
	// Nest's own bootstrap logs are buffered until the pino logger below is
	// installed, so nothing is written through two different loggers.
	const app = await NestFactory.create(AppModule, { bufferLogs: true });

	app.useLogger(app.get(Logger));
	app.useGlobalFilters(new RiotExceptionFilter());
	app.enableCors({ origin: ["http://localhost:5173"] });

	const port = Number(process.env.PORT) || 3080;
	await app.listen(port);
	app.get(Logger).log(`Listening on port ${port}`);
};

void bootstrap();
