import { Inject, Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

import { DRIZZLE } from "./../../core/database/database.constant.ts";
import type { Drizzle } from "./../../core/database/drizzle.ts";
import { perks } from "./../../core/database/models/perks.model.ts";
import { runeIconPath, statPerkIconPath } from "./perk-icon.utils.ts";
import { STAT_PERKS } from "./stat-perk.constant.ts";
import type { IDDragonRuneTree } from "./types/i-ddragon-rune-tree.type.ts";

/** Reads and writes `perks`, the rune dimension every match's runes point at. */
@Injectable()
export class PerkRepository {
	private readonly db: Drizzle;

	constructor(@Inject(DRIZZLE) db: Drizzle) {
		this.db = db;
	}

	/**
	 * Writes every tree and rune Data Dragon lists, and returns how many rows it
	 * touched.
	 *
	 * Upsert rather than insert, and idempotent, because this runs on every boot:
	 * a perk ingest created from a payload — id only, no name — gets its metadata
	 * filled in the first time the asset catches up with Riot.
	 *
	 * The ten stat shards go in alongside them from `stat-perk.constant.ts`,
	 * since Data Dragon does not list them and their rows would otherwise have an
	 * id and nothing else.
	 *
	 * The names are overwritten on purpose. Riot renames runes between seasons,
	 * and the committed asset is the source of truth for what a perk is called;
	 * what a player took is recorded in `match_participant_perks`, which this
	 * never touches.
	 */
	async seed(trees: IDDragonRuneTree[], now: number) {
		const statRows = STAT_PERKS.map((shard) => ({
			id: shard.id,
			key: shard.key,
			name: shard.name,
			icon: statPerkIconPath(shard.key),
			styleId: null,
			slot: null,
			dateCreated: now,
		}));

		const rows = trees.flatMap((tree) => [
			{
				id: tree.id,
				key: tree.key,
				name: tree.name,
				icon: runeIconPath(tree.key),
				// A tree belongs to no tree, which is what marks it as one.
				styleId: null,
				slot: null,
				dateCreated: now,
			},
			...tree.slots.flatMap((slot, slotIndex) =>
				slot.runes.map((rune) => ({
					id: rune.id,
					key: rune.key,
					name: rune.name,
					icon: runeIconPath(rune.key),
					styleId: tree.id,
					slot: slotIndex,
					dateCreated: now,
				})),
			),
		]);

		const all = [...rows, ...statRows];
		if (all.length === 0) return { seeded: 0 };

		await this.db
			.insert(perks)
			.values(all)
			.onConflictDoUpdate({
				target: perks.id,
				set: {
					key: sql`excluded.key`,
					name: sql`excluded.name`,
					icon: sql`excluded.icon`,
					styleId: sql`excluded.style_id`,
					slot: sql`excluded.slot`,
				},
			});

		return { seeded: all.length };
	}
}
