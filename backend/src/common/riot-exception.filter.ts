import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	Logger,
} from "@nestjs/common";
import axios from "axios";
import type { Response } from "express";

/**
 * Turns an upstream Riot failure into the response for it, so controllers can
 * call the API and return a value without a `try`/`catch` of their own.
 *
 * Riot's own status is forwarded rather than flattened: a caller sees 404 for an
 * unknown riot id and 429 when the upstream rate limit is hit.
 */
@Catch()
export class RiotExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(RiotExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const context = host.switchToHttp();
		const response = context.getResponse<Response>();
		const request = context.getRequest<{
			method: string;
			originalUrl: string;
		}>();

		const { status, message } = this.describe(exception);
		this.logger.error(
			`${request.method} ${request.originalUrl} -> ${status}: ${message}`,
			exception instanceof Error ? exception.stack : undefined,
		);

		response.status(status).json({ error: message });
	}

	private describe(exception: unknown) {
		if (axios.isAxiosError(exception)) {
			return {
				status: exception.response?.status ?? 502,
				// The upstream body is not forwarded: it can carry the API key's rate
				// limit headers and Riot's own error text, neither of which is ours.
				message: "Riot API request failed",
			};
		}

		if (exception instanceof HttpException) {
			return { status: exception.getStatus(), message: exception.message };
		}

		return { status: 500, message: "Internal server error" };
	}
}
