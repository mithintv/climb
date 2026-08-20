/**
 * A rune tree as Data Dragon's `runesReforged.json` describes it.
 *
 * Named after its source rather than the domain, so the boundary is visible:
 * this is the shape of a file, and `perks` is the shape the app stores.
 *
 * The file is five trees, each with four slots, each slot holding the runes
 * that compete for it — 62 runes in total. The three stat shards a player also
 * picks are not in this file at all.
 */
export interface IDDragonRuneTree {
	/** Riot's perk id for the tree itself, e.g. 8200 for Sorcery. */
	id: number;
	/** Stable identifier, e.g. "Sorcery". */
	key: string;
	/** Display name. */
	name: string;
	/** Path under Data Dragon's unversioned `img/`. */
	icon: string;
	/** Four rows; the first holds the keystones. */
	slots: {
		runes: {
			id: number;
			key: string;
			name: string;
			icon: string;
		}[];
	}[];
}
