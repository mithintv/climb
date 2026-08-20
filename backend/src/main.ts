import "reflect-metadata";
import "dotenv/config";

import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module.ts";

const bootstrap = async () => {
	// Nest's own bootstrap logs are buffered until the pino logger below is
	// installed, so nothing is written through two different loggers.
	const app = await NestFactory.create(AppModule, { bufferLogs: true });

	app.useLogger(app.get(Logger));
	app.enableCors({ origin: ["http://localhost:5173"] });
	// Without this Nest never calls onApplicationShutdown, so the Postgres pool
	// keeps its sockets open and the process outlives the signal that killed it.
	app.enableShutdownHooks();

	const port = Number(process.env.PORT) || 3080;
	await app.listen(port);
	app.get(Logger).log(`Listening on port ${port}`);
};

void bootstrap();
