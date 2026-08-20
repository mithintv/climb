import { gunzipSync, gzipSync } from "node:zlib";

/**
 * The codec the bytes in `matches.payload` are written with, recorded on every
 * row. Storing it beside the blob is what makes swapping codec a data change —
 * re-encode the old rows in the background — rather than a rewrite of everything
 * that reads them.
 */
export const MATCH_PAYLOAD_ENCODING = "gzip";

/**
 * Compresses a match response body for storage. Measured at 85 KB in, 11.8 KB
 * out on a queue-420 payload.
 *
 * The input is the response body as it arrived, not a re-serialised object.
 * `jsonb` was the obvious column type and is the wrong one: it normalises key
 * order, drops duplicate keys and rewrites numbers, so it cannot return the
 * bytes Riot sent — and byte-exactness is what makes a field Riot adds next
 * patch safe to store today.
 */
export const encodeMatchPayload = (body: string) => {
	const bytes = Buffer.from(body, "utf8");
	return {
		payload: gzipSync(bytes),
		payloadEncoding: MATCH_PAYLOAD_ENCODING,
		payloadBytes: bytes.byteLength,
	};
};

/**
 * Returns a stored payload as the body Riot sent. Throws on an encoding this
 * build does not know, which is a row written by a newer deploy — better than
 * serving bytes decoded as something they are not.
 */
export const decodeMatchPayload = (payload: Buffer, encoding: string) => {
	if (encoding !== MATCH_PAYLOAD_ENCODING) {
		throw new Error(`Unsupported match payload encoding: ${encoding}`);
	}
	return gunzipSync(payload).toString("utf8");
};
