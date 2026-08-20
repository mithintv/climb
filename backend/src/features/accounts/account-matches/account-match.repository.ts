import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";

import { DRIZZLE } from "./../../../core/database/database.constant.ts";
import type { Drizzle } from "./../../../core/database/drizzle.ts";
import { accountMatchSync } from "./../../../core/database/models/account-match-sync.model.ts";
import { accountMatches } from "./../../../core/database/models/account-matches.model.ts";
import { accounts } from "./../../../core/database/models/accounts.model.ts";
import { matches } from "./../../../core/database/models/matches.model.ts";
import { splitMatchId } from "./../../../lib/split-match-id.ts";

/** Which window of an account's ids to read, newest first. */
export interface IMatchIdWindow {
	/**
	 * Read only games in this queue, e.g. 420 for ranked solo/duo. Every queue
	 * when absent.
	 *
	 * The queue is on the match, not on the id, so the filtered read joins
	 * `matches` — which also means it only sees ids whose payload has been
	 * fetched. An id the index holds but nothing has read yet is not in a queue
	 * as far as this query is concerned.
	 */
	queueId?: number;
	/**
	 * Read the ids older than this game id. The cursor form: it names a position
	 * in the list rather than counting from a head that moves, so a game finishing
	 * between two pages cannot make the second repeat or skip ids.
	 */
	beforeGameId?: number;
	/** Offset form, kept because the frontend still pages by it. */
	start: number;
	count: number;
}

/** Every read and write against `account_matches` and `account_match_sync`. */
@Injectable()
export class AccountMatchRepository {
	private readonly db: Drizzle;

	constructor(@Inject(DRIZZLE) db: Drizzle) {
		this.db = db;
	}

	/**
	 * The account's sync row, created on first use.
	 *
	 * `DO UPDATE` writing the key to itself rather than `DO NOTHING`, because
	 * `DO NOTHING` returns nothing on a conflict and the row is wanted either way
	 * — this is one statement for both the first request and every later one.
	 */
	async ensureSync(accountId: number) {
		const [row] = await this.db
			.insert(accountMatchSync)
			.values({ accountId })
			.onConflictDoUpdate({
				target: accountMatchSync.accountId,
				set: { accountId: sql`excluded.account_id` },
			})
			.returning();

		return row;
	}

	/**
	 * Which of `matchIds` the account already holds.
	 *
	 * Scoped to the ids asked about rather than returning the whole index: the
	 * merge functions only ever ask about the page in hand, and a long history
	 * should not be loaded into memory to write twenty ids.
	 */
	async findKnown(accountId: number, matchIds: readonly string[]) {
		if (matchIds.length === 0) return new Set<string>();

		const rows = await this.db
			.select({ matchId: accountMatches.matchId })
			.from(accountMatches)
			.where(
				and(
					eq(accountMatches.accountId, accountId),
					inArray(accountMatches.matchId, [...matchIds]),
				),
			);

		return new Set(rows.map((row) => row.matchId));
	}

	/**
	 * Adds ids to the index, ignoring any already there.
	 *
	 * Written blind on purpose: every page is fetched with an overlap it is
	 * expected to re-see, so `DO NOTHING` on the unique constraint is what makes
	 * over-fetching free. The count returned is how many were new, which is how
	 * the caller knows a backfill page made progress.
	 */
	async insertIds(
		accountId: number,
		matchIds: readonly string[],
		dateCreated: number,
	) {
		if (matchIds.length === 0) return 0;

		const rows = await this.db
			.insert(accountMatches)
			.values(
				matchIds.map((matchId) => ({
					accountId,
					matchId,
					...splitMatchId(matchId),
					dateCreated,
				})),
			)
			.onConflictDoNothing()
			.returning({ id: accountMatches.id });

		return rows.length;
	}

	/**
	 * Recomputes the sync counters from `account_matches`, applying `patch` in the
	 * same statement.
	 *
	 * Derived rather than incremented because `synced_count` is used as an offset
	 * into Riot's own list: a count that had drifted from the rows actually held
	 * would start the next backfill in the wrong place and skip whatever sat
	 * between. Recomputing costs an indexed aggregate and cannot drift.
	 */
	async refreshSync(
		accountId: number,
		patch: { headSyncedAt?: number; backfillComplete?: boolean } = {},
	) {
		// Both aggregates run as subqueries inside the UPDATE, so neither count
		// travels to Node and back.
		const held = eq(accountMatches.accountId, accountId);

		const [row] = await this.db
			.update(accountMatchSync)
			.set({
				...patch,
				syncedCount: sql`(select count(*)::int from ${accountMatches} where ${held})`,
				oldestGameId: sql`(select min(${accountMatches.gameId}) from ${accountMatches} where ${held})`,
			})
			.where(eq(accountMatchSync.accountId, accountId))
			.returning();

		return row;
	}

	/**
	 * The account's ids whose payload has never been fetched, newest first.
	 *
	 * The index and the payloads are filled by different calls — one id-list call
	 * brings back twenty ids, and each payload is a call of its own — so the index
	 * always runs ahead. These are the ids a sync still owes a fetch.
	 */
	async listUningestedMatchIds(accountId: number, limit: number) {
		const rows = await this.db
			.select({ matchId: accountMatches.matchId })
			.from(accountMatches)
			.leftJoin(matches, eq(matches.matchId, accountMatches.matchId))
			.where(and(eq(accountMatches.accountId, accountId), isNull(matches.id)))
			.orderBy(desc(accountMatches.gameId))
			.limit(limit);

		return rows.map((row) => row.matchId);
	}

	/**
	 * The puuids of accounts with work left: history still to reach, or ids still
	 * holding no payload.
	 *
	 * Read once at startup so a restart resumes what it was doing rather than
	 * waiting for someone to press update again.
	 */
	async listAccountsNeedingWork() {
		const pending = this.db
			.select({ accountId: accountMatches.accountId })
			.from(accountMatches)
			.leftJoin(matches, eq(matches.matchId, accountMatches.matchId))
			.where(isNull(matches.id));

		const rows = await this.db
			.selectDistinct({ puuid: accounts.puuid })
			.from(accountMatchSync)
			.innerJoin(accounts, eq(accounts.id, accountMatchSync.accountId))
			.where(
				or(
					eq(accountMatchSync.backfillComplete, false),
					inArray(accountMatchSync.accountId, pending),
				),
			);

		return rows.map((row) => row.puuid);
	}

	/** How many of the account's ids are still waiting for a payload. */
	async countUningestedMatchIds(accountId: number) {
		const [row] = await this.db
			.select({ pending: sql<number>`count(*)::int` })
			.from(accountMatches)
			.leftJoin(matches, eq(matches.matchId, accountMatches.matchId))
			.where(and(eq(accountMatches.accountId, accountId), isNull(matches.id)));

		return row?.pending ?? 0;
	}

	/**
	 * A window of the account's ids, newest first.
	 *
	 * Ordered by `game_id` rather than by anything off a payload, so an id is
	 * placed correctly the moment it is indexed. Ids from two platforms would
	 * interleave by a number only comparable within one, which no account seen so
	 * far has — a puuid plays on the shard it was made on.
	 *
	 * A queue narrows it through `matches`, whose projection holds the queue the
	 * game was played in.
	 *
	 * The join is left rather than inner so the unfiltered read is unaffected by
	 * it: most ids in the index have no `matches` row, because the index is
	 * populated from Riot's id list and a payload is only fetched when someone
	 * looks at the game. When a queue is asked for, the predicate on the joined
	 * column drops those rows anyway — which is correct, an id nothing has read
	 * cannot be shown to be ranked.
	 */
	async listMatchIds(accountId: number, window: IMatchIdWindow) {
		const rows = await this.db
			.select({ matchId: accountMatches.matchId })
			.from(accountMatches)
			.leftJoin(matches, eq(matches.matchId, accountMatches.matchId))
			.where(
				and(
					eq(accountMatches.accountId, accountId),
					window.queueId === undefined
						? undefined
						: eq(matches.queueId, window.queueId),
					window.beforeGameId === undefined
						? undefined
						: lt(accountMatches.gameId, window.beforeGameId),
				),
			)
			.orderBy(desc(accountMatches.gameId))
			.limit(window.count)
			// A cursor already names where to start, so the offset only applies to
			// the offset form; combining them would page from inside the cursor.
			.offset(window.beforeGameId === undefined ? window.start : 0);

		return rows.map((row) => row.matchId);
	}
}
