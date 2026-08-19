/**
 * Injection token for the `pg` connection pool. A token is needed because the
 * pool is a class from a library that Nest does not construct itself, so there
 * is no class to inject by type. Nothing but the module's own shutdown hook
 * should need it; repositories inject `DRIZZLE`.
 */
export const DATABASE_POOL = Symbol("DATABASE_POOL");

/** Injection token for the drizzle handle. Every repository injects this. */
export const DRIZZLE = Symbol("DRIZZLE");
