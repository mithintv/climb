import { ITEM_TIERS, type ItemTier } from "../types/item-tier.type";

/** Tab and heading text per tier; the tiers themselves are the shop's. */
const TIER_LABELS: Record<ItemTier, string> = {
	CONSUMABLE: "Consumables",
	TRINKET: "Trinkets",
	STARTER: "Starter",
	BASIC: "Basic",
	EPIC: "Epic",
	LEGENDARY: "Legendary",
};

/**
 * The tier tabs across the top, in `ITEM_TIERS` order so a tab and the heading
 * it scopes to always agree. `undefined` is the all-items tab.
 */
export const TIER_TABS: { tier: ItemTier | undefined; label: string }[] = [
	{ tier: undefined, label: "All" },
	...ITEM_TIERS.map((tier) => ({ tier, label: TIER_LABELS[tier] })),
];
