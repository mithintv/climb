import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, sql } from "drizzle-orm";

import { DRIZZLE } from "./../../core/database/database.constant.ts";
import type { Drizzle } from "./../../core/database/drizzle.ts";
import { accounts } from "./../../core/database/models/accounts.model.ts";

/** An account as the Riot API describes it, before it becomes a row. */
export interface IAccountToStore {
	puuid: string;
	gameName: string;
	tagLine: string;
	region: string;
}

/** Every read and write against the `accounts` table. */
@Injectable()
export class AccountRepository {
	private readonly db: Drizzle;

	constructor(@Inject(DRIZZLE) db: Drizzle) {
		this.db = db;
	}

	/**
	 * Looks an account up by riot id, case-insensitively. Returns the most
	 * recently checked row: a name freed by a rename can be claimed by another
	 * puuid, so more than one row may carry it until the stale one is refreshed.
	 */
	async findByRiotId(gameName: string, tagLine: string) {
		return this.db.query.accounts.findFirst({
			where: and(
				eq(accounts.gameNameKey, gameName.toLowerCase()),
				eq(accounts.tagLineKey, tagLine.toLowerCase()),
			),
			orderBy: desc(accounts.riotIdCheckedAt),
		});
	}

	/**
	 * Inserts or refreshes an account. Conflicts resolve on `puuid`, never on the
	 * name, so a rename updates the existing row instead of creating a second one.
	 */
	async upsert(account: IAccountToStore, checkedAt: number) {
		const [row] = await this.db
			.insert(accounts)
			.values({
				puuid: account.puuid,
				gameName: account.gameName,
				tagLine: account.tagLine,
				gameNameKey: account.gameName.toLowerCase(),
				tagLineKey: account.tagLine.toLowerCase(),
				region: account.region,
				riotIdCheckedAt: checkedAt,
				dateCreated: checkedAt,
				dateUpdated: checkedAt,
			})
			.onConflictDoUpdate({
				target: accounts.puuid,
				set: {
					gameName: sql`excluded.game_name`,
					tagLine: sql`excluded.tag_line`,
					gameNameKey: sql`excluded.game_name_key`,
					tagLineKey: sql`excluded.tag_line_key`,
					region: sql`excluded.region`,
					riotIdCheckedAt: sql`excluded.riot_id_checked_at`,
					dateUpdated: sql`excluded.date_updated`,
				},
			})
			.returning();

		return row;
	}
}
