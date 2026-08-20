import "reflect-metadata";
import "dotenv/config";

import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module.ts";
import { StructuredNestLogger } from "./core/logging/structured-nest-logger.ts";

const bootstrap = async () => {
	// Nest's own bootstrap logs are buffered until the pino logger below is
	// installed, so nothing is written through two different loggers.
	const app = await NestFactory.create(AppModule, { bufferLogs: true });

	const logger = app.get(Logger);
	app.useLogger(new StructuredNestLogger(logger));
	app.enableCors({ origin: ["http://localhost:5173"] });
	// Without this Nest never calls onApplicationShutdown, so the Postgres pool
	// keeps its sockets open and the process outlives the signal that killed it.
	app.enableShutdownHooks();

	const port = Number(process.env.PORT) || 3080;
	await app.listen(port);
	// `msg` is pino's message key: the port goes out as a property and the
	// template names it, so the console reads the same and Seq gets a field.
	logger.log({ port, msg: "Listening on port {port}" }, "Bootstrap");
};

void bootstrap();
