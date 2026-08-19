import { createRouter } from "@tanstack/react-router";

import { indexRoute } from "@/routes/index-route";
import { itemsIndexRoute, itemsRoute } from "@/routes/items-route";
import { NotFound } from "@/routes/not-found";
import { rootRoute } from "@/routes/root-route";
import { summonerRoute } from "@/routes/summoner-route";

// The route tree, assembled. Each URL space defines itself — paths, URL
// validation and the page it renders — in its own file under `routes/`.

const routeTree = rootRoute.addChildren([
	indexRoute,
	itemsIndexRoute,
	itemsRoute,
	summonerRoute,
]);

export const router = createRouter({
	routeTree,
	defaultNotFoundComponent: NotFound,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
