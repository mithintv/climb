import "dotenv/config";
import { hostname } from "node:os";

import { type Level, multistream, pino, type StreamEntry } from "pino";
import pretty from "pino-pretty";
import { PinoSeqStream } from "pino-seq";

const isProduction = process.env.NODE_ENV === "production";
const level = (process.env.LOG_LEVEL ??
	(isProduction ? "info" : "debug")) as Level;

// Resolves "res.statusCode" against the log object. Returns undefined for a path
// that does not exist, so the placeholder can be left intact as a typo signal.
const resolvePath = (log: Record<string, unknown>, path: string) => {
	let value: unknown = log;
	for (const key of path.split(".")) {
		if (typeof value !== "object" || value === null) return undefined;
		if (!(key in value)) return undefined;
		value = (value as Record<string, unknown>)[key];
	}
	return value;
};

// The terminal shows only the rendered message: `{prop}` placeholders are filled
// in from the log object, which is then hidden. Seq still receives every property.
const renderMessage = (log: Record<string, unknown>, messageKey: string) => {
	const template = String(log[messageKey] ?? "");
	const message = template.replace(
		/\{([\w.]+)\}/g,
		(placeholder, path: string) => {
			const value = resolvePath(log, path);
			if (value === undefined) return placeholder;
			return typeof value === "object" && value !== null
				? JSON.stringify(value)
				: String(value);
		},
	);
	const err = log.err as { message?: string; stack?: string } | undefined;
	return err ? `${message}\n${err.stack ?? err.message}` : message;
};

// Pretty console output in dev, raw JSON on stdout in production.
const streams: StreamEntry[] = [
	{
		level,
		stream: isProduction
			? process.stdout
			: pretty({
					colorize: true,
					translateTime: "HH:MM:ss",
					hideObject: true,
					ignore: "pid,hostname",
					messageFormat: renderMessage,
				}),
	},
];

// Seq is optional so local dev works without an instance running.
if (process.env.SEQ_URL) {
	streams.push({
		level,
		stream: new PinoSeqStream({
			serverUrl: process.env.SEQ_URL,
			apiKey: process.env.SEQ_API_KEY,
		}),
	});
}

export const logger = pino(
	{
		base: {
			pid: process.pid,
			hostname: hostname(),
			application: "climb-api",
			environment: isProduction ? "production" : "development",
		},
		level,
		redact: [
			"req.headers.authorization",
			"req.headers.cookie",
			'req.headers["x-riot-token"]',
		],
	},
	multistream(streams),
);
