/**
 * Injection token for the `DatabaseSync` handle. A token is needed because the
 * handle is a class from `node:sqlite` that Nest does not construct itself, so
 * there is no class to inject by type.
 */
export const DATABASE = Symbol("DATABASE");

/**
 * Injection token for the drizzle handle. Repositories inject this; the raw
 * DATABASE handle stays for the migration runner and for PRAGMAs.
 */
export const DRIZZLE = Symbol("DRIZZLE");
