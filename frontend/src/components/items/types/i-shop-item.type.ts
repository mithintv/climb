import type { IDDragonRawItem } from "./i-ddragon-raw-item.type";
import type { ItemTier } from "./item-tier.type";

/**
 * An `IDDragonRawItem` resolved for display: ids defaulted to arrays, the tier
 * derived and the icon URL built, so components never touch the asset's
 * optionals.
 */
export interface IShopItem {
	/** Data Dragon's item id, and the key the URL carries in `?item=`. */
	id: string;
	name: string;
	description: string;
	/** Alias list the client searches alongside the name. */
	colloq: string;
	/** One-line summary; the long `description` is markup. */
	plaintext: string;
	tags: string[];
	stats: Record<string, number>;
	gold: IDDragonRawItem["gold"];
	/** Ids of the components this item is built from; empty if none. */
	from: string[];
	/** Ids of the items this one builds into; empty if it is finished. */
	into: string[];
	/** Data Dragon's build depth, absent on items that build from nothing. */
	depth: number | undefined;
	tier: ItemTier;
	iconUrl: string;
}
