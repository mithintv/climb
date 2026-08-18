import type { IShopItem } from "./i-shop-item.type";
import type { ItemTier } from "./item-tier.type";

/** A tier heading and the items shelved under it, already sorted. */
export interface ITierGroup {
	tier: ItemTier;
	items: IShopItem[];
}
