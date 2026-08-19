import type { ItemSort } from "./item-sort.type";
import type { ItemTier } from "./item-tier.type";

/** Everything the grid reads out of the URL. */
export interface IItemSearch {
	/** Free-text query, matched against name, aliases and summary. */
	q?: string;
	/** Selected tier tab; absent is the all-items tab. */
	tier?: ItemTier;
	/** Selected `IItemTagFilter` keys, which stack. */
	stats?: string[];
	sort?: ItemSort;
	/** Id of the item the detail panel is open on. */
	item?: string;
}
