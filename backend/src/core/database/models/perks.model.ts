import { bigint, integer, pgTable, text } from "drizzle-orm/pg-core";

/**
 * A rune or a rune tree, one row per id, keyed on Riot's own perk id.
 *
 * Trees and the runes inside them share this table because the payload does not
 * distinguish them either — `perks.styles[].style` is 8200 and
 * `selections[].perk` is 8992, both plain perk ids. A tree is the row whose
 * `style_id` is null; a rune points at the tree it belongs to.
 *
 * `key`, `name`, `icon` and `slot` come from Data Dragon's `runesReforged.json`
 * and are filled in by the seed at boot. They are nullable because ingest can
 * meet a perk id the committed asset has never heard of — a rune added next
 * preseason, or Arena's literal `0`, where the payload reports no runes at all.
 * Such a row exists with an id and nothing else rather than failing the match,
 * and the next seed fills it in if Data Dragon has since caught up.
 */
export const perks = pgTable("perks", {
	/** Riot's perk id: 8200 for the Sorcery tree, 8992 for Dark Harvest. */
	id: integer("id").primaryKey(),
	/** Data Dragon's stable identifier, e.g. "DarkHarvest". */
	key: text("key"),
	/** Display name, e.g. "Dark Harvest". */
	name: text("name"),
	/**
	 * Path to the committed art under `frontend/src/assets/`, e.g.
	 * "icons/runes/scorch.png" — not Data Dragon's own path, since the icons are
	 * committed rather than hotlinked. See `perk-icon.utils.ts`.
	 */
	icon: text("icon"),
	/** The tree this rune belongs to. Null when the row is itself a tree. */
	styleId: integer("style_id"),
	/** Row within the tree, 0-3. Slot 0 of a primary tree is the keystone row. */
	slot: integer("slot"),
	/** Epoch ms this row was written. */
	dateCreated: bigint("date_created", { mode: "number" }).notNull(),
});
