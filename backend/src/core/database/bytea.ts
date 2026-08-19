import { customType } from "drizzle-orm/pg-core";

/**
 * A `bytea` column. drizzle has no builtin for it, and node-postgres already
 * hands back a `Buffer` and accepts one as a parameter, so the custom type only
 * has to name the SQL type — no encoding or decoding of its own.
 */
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
	dataType() {
		return "bytea";
	},
});
