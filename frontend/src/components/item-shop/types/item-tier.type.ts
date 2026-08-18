/**
 * The shop's own headings, in display order. `Consumable` and `Trinket` are
 * tags rather than build tiers, but the shop groups them the same way.
 */
export const ITEM_TIERS = [
	"STARTER",
	"BASIC",
	"EPIC",
	"LEGENDARY",
	"CONSUMABLE",
	"TRINKET",
] as const;

/** One of the shop's headings. Derived by `deriveTier`; never in the payload. */
export type ItemTier = (typeof ITEM_TIERS)[number];
