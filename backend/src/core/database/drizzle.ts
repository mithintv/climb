import { drizzle } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";

import { accounts } from "./models/accounts.model.ts";
import { matchParticipants } from "./models/match-participants.model.ts";
import { matches } from "./models/matches.model.ts";

/**
 * Every table, as the one object drizzle wants.
 *
 * Assembled here rather than in a file of its own: binding the schema is what
 * this module already does, and a `models/index.ts` that only re-exported them
 * would be a barrel. A table missing from this object still works for
 * `db.select()` and silently disappears from `db.query`, so a new model file
 * must be added here too.
 */
const schema = { accounts, matches, matchParticipants };

/**
 * Drizzle over a node-postgres pool.
 *
 * Binding the schema is the point: it is what gives callers `db.query.<table>`
 * and the inferred row types, and doing it here means a second connection
 * cannot be built without it.
 */
export const createDrizzle = (pool: Pool) => drizzle(pool, { schema });

/** The drizzle handle, inferred so callers do not restate it. */
export type Drizzle = ReturnType<typeof createDrizzle>;
