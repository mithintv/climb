import type { LoggerService } from "@nestjs/common";
import type { Logger } from "nestjs-pino";

/**
 * Nest's bootstrap lines and the fields each was built from.
 *
 * Nest composes these as finished strings (`@nestjs/core/helpers/messages`), so
 * the module, controller and route only exist inside the text. Each rule takes
 * one apart again and returns the parts as properties, with a `{placeholder}`
 * template in the message's place — `msg` is pino's message key, and both the
 * renderer in `logger.ts` and Seq fill the placeholders back in.
 *
 * The templates drop the braces Nest wraps a path in (`Mapped {/accounts, GET}
 * route`). A message template reads `{{` as an escaped literal brace, so Seq
 * renders `{{path}}` as the text `{path}` and never substitutes the property —
 * the decoration cannot be kept without losing the field it decorates.
 *
 * The optional `(version: …)` groups cover the versioned variants of the same
 * two messages; `version` is left off the record when a route is unversioned.
 */
const NEST_MESSAGE_RULES = [
	{
		pattern: /^(\w+) dependencies initialized$/,
		toRecord: ([, module]: RegExpExecArray) => ({
			module,
			msg: "{module} dependencies initialized",
		}),
	},
	{
		pattern: /^(\w+) \{(.+?)\}(?: \(version: (.+?)\))?:$/,
		toRecord: ([, controller, path, version]: RegExpExecArray) => ({
			controller,
			path,
			...(version === undefined ? {} : { version }),
			msg:
				version === undefined
					? "{controller} mapped to {path}"
					: "{controller} mapped to {path} (version: {version})",
		}),
	},
	{
		pattern: /^Mapped \{(.+?), (\w+)\}(?: \(version: (.+?)\))? route$/,
		toRecord: ([, path, method, version]: RegExpExecArray) => ({
			path,
			method,
			...(version === undefined ? {} : { version }),
			msg:
				version === undefined
					? "Mapped {method} {path} route"
					: "Mapped {method} {path} route (version: {version})",
		}),
	},
];

/**
 * Turns a Nest bootstrap message into the record its rule describes, or
 * undefined for anything unrecognised, which is then logged untouched.
 */
const toStructuredMessage = (message: unknown) => {
	if (typeof message !== "string") return undefined;

	for (const { pattern, toRecord } of NEST_MESSAGE_RULES) {
		const match = pattern.exec(message);
		if (match) return toRecord(match);
	}

	return undefined;
};

/**
 * Wraps the pino logger Nest logs through so its own startup lines arrive
 * structured rather than as prose. Every level delegates unchanged; only the
 * message is rewritten, and only when it matches one of the rules above.
 *
 * `error` and `fatal` are passed straight through: nestjs-pino reads an Error
 * and its stack out of those arguments, and none of the rewritten messages are
 * logged at those levels anyway.
 */
export class StructuredNestLogger implements LoggerService {
	private readonly logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	verbose(message: unknown, ...optionalParams: unknown[]) {
		this.logger.verbose(
			toStructuredMessage(message) ?? message,
			...optionalParams,
		);
	}

	debug(message: unknown, ...optionalParams: unknown[]) {
		this.logger.debug(
			toStructuredMessage(message) ?? message,
			...optionalParams,
		);
	}

	log(message: unknown, ...optionalParams: unknown[]) {
		this.logger.log(toStructuredMessage(message) ?? message, ...optionalParams);
	}

	warn(message: unknown, ...optionalParams: unknown[]) {
		this.logger.warn(
			toStructuredMessage(message) ?? message,
			...optionalParams,
		);
	}

	error(message: unknown, ...optionalParams: unknown[]) {
		this.logger.error(message, ...optionalParams);
	}

	fatal(message: unknown, ...optionalParams: unknown[]) {
		this.logger.fatal(message, ...optionalParams);
	}
}
