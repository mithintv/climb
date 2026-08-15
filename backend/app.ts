import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import createError, { type HttpError } from "http-errors";
import { pinoHttp } from "pino-http";

import { logger } from "./logging/logger.ts";
import indexRouter from "./routes/index.ts";

const app = express();

app.use(
	cors({
		origin: ["http://localhost:5173"],
	}),
);

// pino-http's default messages are the bare strings "request completed" and
// "request errored"; these templates render the request details that otherwise
// only appear in the hidden req/res objects.
app.use(
	pinoHttp({
		logger,
		customSuccessMessage: () =>
			"{req.method} {req.url} -> {res.statusCode} ({responseTime}ms)",
		customErrorMessage: () =>
			"{req.method} {req.url} -> {res.statusCode} (errored)",
	}),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use((_req, _res, next) => {
	next(createError(404));
});

// error handler
// Express identifies error handlers by arity, so `next` has to stay in the
// signature even though it is unused.
app.use((err: HttpError, req: Request, res: Response, _next: NextFunction) => {
	const status = err.status || 500;
	req.log.error(
		{ err, status, method: req.method, url: req.originalUrl },
		"Request failed: {method} {url} -> {status}",
	);
	res.status(status).json({ error: err.message });
});

const port = Number(process.env.PORT) || 3080;
app.listen(port, () => logger.info({ port }, "Listening on port {port}"));
