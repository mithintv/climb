import { sql } from "drizzle-orm";
import {
	bigint,
	index,
	integer,
	pgTable,
	serial,
	text,
	unique,
} from "drizzle-orm/pg-core";

import { accounts } from "./accounts.model.ts";

/**
 * One match id Riot's match list returned for one account: the cached copy of
 * `matches/by-puuid/{puuid}/ids`, which is what makes paging a player's history
 * a database read instead of an offset window over a list that grows at the
 * head.
 *
 * A row means Riot's id list *for this account's puuid* returned that id, and
 * nothing else.
 *
 * Which is why this is not `match_participants` under another name, even though
 * that table already pairs a puuid with a match. A row lands there whenever
 * *someone* fetches a match, so the nine other players in it pick up rows for a
 * history nobody asked to sync — and nothing distinguishes "all of this
 * player's games" from "the few that overlapped another player's browsing".
 * Completeness is the only property the paging needs, and it is the one
 * property a derived set cannot have.
 *
 * `account_match_sync.synced_count` is what makes that fatal rather than
 * untidy: it is used as `start` against Riot's own list, so it has to equal the
 * length of the prefix of that list actually read. Counting inferred rows
 * instead points the next backfill at an arbitrary offset, and every id between
 * there and the real position is skipped — silently, and permanently, since
 * nothing later goes looking for ids it does not know are missing.
 *
 * The other half is cost. This table holds ids whose payloads have not been
 * fetched, which is what makes paging deep into a history one id-list call;
 * deriving the list from ingested payloads would mean fetching a full match for
 * every id on the page just to know the id exists.
 *
 * The DDL is generated from this file by `pnpm --filter backend db:generate`.
 */
export const accountMatches = pgTable(
	"account_matches",
	{
		id: serial("id").primaryKey(),
		accountId: integer("account_id")
			.notNull()
			.references(() => accounts.id),
		/**
		 * Riot's match id, e.g. "NA1_5451234567".
		 *
		 * Deliberately not a foreign key to `matches`: the index is populated from
		 * the id list, which knows an id long before — and often without ever —
		 * fetching its payload. Requiring a `matches` row would force a full fetch
		 * of a player's history just to page it.
		 */
		matchId: text("match_id").notNull(),
		/**
		 * The id's game component, split out so it can be ordered on.
		 *
		 * It is monotonic per platform, so it sorts by recency correctly before a
		 * single payload has been fetched — `game_creation` would need one.
		 */
		gameId: bigint("game_id", { mode: "number" }).notNull(),
		/**
		 * The id's platform component, e.g. "NA1". Not a foreign key to
		 * `game_platforms` for the same reason `match_id` is not one to `matches`.
		 */
		platformId: text("platform_id").notNull(),
		/** Epoch ms this id first appeared in a fetched page. */
		dateCreated: bigint("date_created", { mode: "number" }).notNull(),
	},
	(table) => [
		// The whole sync strategy leans on this: pages are re-fetched with a
		// deliberate overlap and written blind, so duplicates have to be free.
		unique("account_matches_by_match").on(table.accountId, table.matchId),
		// Every read is one account's ids newest first, by cursor or by offset.
		index("account_matches_by_recency").on(
			table.accountId,
			sql`${table.gameId} DESC`,
		),
	],
);
