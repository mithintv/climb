import { HttpException, Injectable, Logger } from "@nestjs/common";
import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

/** How long an upstream call may hang before it is abandoned. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Enough of an error body to diagnose from, short of pasting an HTML page in. */
const MAX_LOGGED_BODY = 500;

/**
 * Renders an upstream error body for the log. It is the only place the body is
 * used — it is never returned to the caller — and it is where the reason lives:
 * Riot answers a bad riot id with `{"status":{"message":"Data not found …"}}`,
 * which says far more than the bare 404 does.
 *
 * A request that never got a response has no body, and a gateway may answer
 * with an HTML page, so this tolerates both.
 */
const describeBody = (body: unknown) => {
	if (body === undefined || body === null || body === "") return "";

	let rendered: string;
	try {
		rendered = typeof body === "string" ? body : JSON.stringify(body);
	} catch {
		// A circular or otherwise unserialisable body must not break the logging
		// of the failure it belongs to.
		rendered = String(body);
	}

	const truncated =
		rendered.length > MAX_LOGGED_BODY
			? `${rendered.slice(0, MAX_LOGGED_BODY)}… (${rendered.length} chars)`
			: rendered;
	return ` body=${truncated}`;
};

/**
 * The one client every outbound HTTP call goes through.
 *
 * Its job is to make an upstream failure look like a normal Nest error at the
 * point it happens, so nothing downstream needs a `try`/`catch` and no global
 * exception filter has to reverse-engineer what went wrong. It is also the
 * place timeouts, retries and rate limiting belong when they are needed —
 * today it only sets a timeout.
 */
@Injectable()
export class HttpClientService {
	private readonly logger = new Logger(HttpClientService.name);
	private readonly client: AxiosInstance;

	constructor() {
		this.client = axios.create({ timeout: REQUEST_TIMEOUT_MS });

		this.client.interceptors.response.use(
			(response) => response,
			(error: unknown) => {
				if (!axios.isAxiosError(error)) throw error;

				// The upstream status is forwarded rather than flattened, so a caller
				// sees 404 for something that does not exist and 429 when a rate limit
				// is hit. A request that never got a response — timeout, DNS, refused
				// connection — is a bad gateway, not a 500: nothing failed here.
				const status = error.response?.status ?? 502;
				this.logger.error(
					`${error.config?.method?.toUpperCase()} ${error.config?.url} -> ${status}: ${error.message}${describeBody(error.response?.data)}`,
				);

				// The upstream body is deliberately not passed on: it can carry API
				// keys' rate limit headers and the provider's own error text.
				throw new HttpException("Upstream request failed", status);
			},
		);
	}

	/** A GET returning the response body, with failures already translated. */
	async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.get<T>(url, config);
		return response.data;
	}

	/**
	 * A GET returning the response body as the characters that arrived, with
	 * nothing parsed.
	 *
	 * `get` is the one to reach for. This exists for a body that is stored rather
	 * than read: parsing and re-serialising JSON normalises key order, drops
	 * duplicate keys and rewrites numbers, so a store built on `get` could not
	 * return what the upstream actually sent. `transformResponse` is emptied
	 * because axios parses JSON on its own otherwise, whatever `responseType`
	 * says.
	 */
	async getText(url: string, config?: AxiosRequestConfig): Promise<string> {
		const response = await this.client.get<string>(url, {
			...config,
			responseType: "text",
			transformResponse: [],
		});
		return response.data;
	}
}
