import {
	createRootRoute,
	createRoute,
	createRouter,
	Link,
	notFound,
	Outlet,
	redirect,
} from "@tanstack/react-router";

import { ItemShop } from "@/components/items/item-shop";
import { SummonerName } from "@/components/summoner-name";
import type { ItemSearch, ItemSort } from "@/lib/items";
import { ITEM_TIERS, ITEM_VERSION, isKnownVersion } from "@/lib/items";

const rootRoute = createRootRoute({
	component: () => (
		<>
			<nav className="flex h-14 items-center gap-8 border-white/10 border-b px-6">
				<Link
					to="/"
					className="bg-linear-to-r from-cyan-400 to-indigo-400 bg-clip-text font-extrabold text-lg text-transparent tracking-[0.3em]"
				>
					Climb
				</Link>
				<Link
					to="/items/$version"
					params={{ version: ITEM_VERSION }}
					className="text-muted-foreground text-sm transition-colors hover:text-foreground [&.active]:text-foreground"
				>
					Items
				</Link>
			</nav>
			<Outlet />
		</>
	),
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: SummonerName,
});

// Bare /items resolves to the newest patch that can be served. Once items move
// to the backend this becomes a lookup rather than a constant.
const itemsIndexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/items",
	beforeLoad: () => {
		throw redirect({
			to: "/items/$version",
			params: { version: ITEM_VERSION },
		});
	},
});

const isSort = (value: unknown): value is ItemSort =>
	value === "gold-asc" || value === "gold-desc";

const itemsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/items/$version",
	// Filters live in the URL so a narrowed view is linkable. Defaults are left
	// out of the search object entirely, which keeps the bare route clean.
	validateSearch: (search: Record<string, unknown>): ItemSearch => ({
		q: typeof search.q === "string" && search.q ? search.q : undefined,
		tier: ITEM_TIERS.find((tier) => tier === search.tier),
		stats: Array.isArray(search.stats)
			? search.stats.filter((key): key is string => typeof key === "string")
			: undefined,
		sort: isSort(search.sort) ? search.sort : undefined,
		item: typeof search.item === "string" ? search.item : undefined,
	}),
	loader: ({ params }) => {
		if (!isKnownVersion(params.version)) throw notFound();
	},
	component: ItemShop,
});

const routeTree = rootRoute.addChildren([
	indexRoute,
	itemsIndexRoute,
	itemsRoute,
]);

export const router = createRouter({
	routeTree,
	defaultNotFoundComponent: () => (
		<main className="p-10 text-center text-muted-foreground">
			<p className="text-foreground text-lg">Not found</p>
			<p className="mt-2 text-sm">
				Only patch {ITEM_VERSION} is available until items move to the backend.
			</p>
		</main>
	),
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
