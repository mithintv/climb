import { createRoute, notFound, redirect } from "@tanstack/react-router";

import { ITEM_VERSION } from "@/components/item-shop/constants/item-version.constant";
import { ItemShop } from "@/components/item-shop/item-shop";
import { isKnownVersion } from "@/components/item-shop/item-shop.utils";
import type { IItemSearch } from "@/components/item-shop/types/i-item-search.type";
import { ITEM_TIERS } from "@/components/item-shop/types/item-tier.type";

import { rootRoute } from "./root-route";

/**
 * `/items` — no page of its own. Bare `/items` resolves to the newest patch
 * that can be served; once items move to the backend this becomes a lookup
 * rather than a constant.
 */
export const itemsIndexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/items",
	beforeLoad: () => {
		throw redirect({
			to: "/items/$version",
			params: { version: ITEM_VERSION },
		});
	},
});

/** The item shop for one patch. */
const ItemsPage = () => <ItemShop />;

/** `/items/$version` */
export const itemsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/items/$version",
	// Filters live in the URL so a narrowed view is linkable. Defaults are left
	// out of the search object entirely, which keeps the bare route clean.
	validateSearch: (search: Record<string, unknown>): IItemSearch => ({
		q: typeof search.q === "string" && search.q ? search.q : undefined,
		tier: ITEM_TIERS.find((tier) => tier === search.tier),
		stats: Array.isArray(search.stats)
			? search.stats.filter((key): key is string => typeof key === "string")
			: undefined,
		sort:
			search.sort === "gold-asc" || search.sort === "gold-desc"
				? search.sort
				: undefined,
		item: typeof search.item === "string" ? search.item : undefined,
	}),
	loader: ({ params }) => {
		if (!isKnownVersion(params.version)) throw notFound();
	},
	component: ItemsPage,
});
