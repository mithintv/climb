import {
	bigint,
	integer,
	pgTable,
	serial,
	uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * A game patch, one row per `major.minor` Riot has been seen to serve.
 *
 * Riot reports a build string per match — "16.14.794.9266" — where only the
 * first two components are the patch anyone talks about; the rest is the build,
 * and one patch ships several. Rows are keyed on `(major, minor)` so a patch is
 * one row rather than one per hotfix, and the full build string is left in the
 * payload, which nothing renders and nothing groups by.
 *
 * `major` and `minor` are integers rather than the string split back up, so
 * ordering is numeric: "16.9" sorts before "16.14", which it would not as text.
 *
 * Rows are created by ingest as new patches appear. Nothing seeds this table —
 * a patch exists here because a match was played on it.
 */
export const patches = pgTable(
	"patches",
	{
		id: serial("id").primaryKey(),
		/** 16 in "16.14.794.9266". */
		major: integer("major").notNull(),
		/** 14 in "16.14.794.9266". */
		minor: integer("minor").notNull(),
		/** Epoch ms this row was written, which is the first match seen on the patch. */
		dateCreated: bigint("date_created", { mode: "number" }).notNull(),
	},
	(table) => [uniqueIndex("patches_by_version").on(table.major, table.minor)],
);
