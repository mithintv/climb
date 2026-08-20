import { createRouter } from "@tanstack/react-router";

import { championsRoute } from "@/routes/champions-route";
import { indexRoute } from "@/routes/index-route";
import { itemsIndexRoute, itemsRoute } from "@/routes/items-route";
import { ladderRoute } from "@/routes/ladder-route";
import { NotFound } from "@/routes/not-found";
import { profileRoute } from "@/routes/profile-route";
import { rootRoute } from "@/routes/root-route";

// The route tree, assembled. Each URL space defines itself — paths, URL
// validation and the page it renders — in its own file under `routes/`.

const routeTree = rootRoute.addChildren([
	championsRoute,
	indexRoute,
	itemsIndexRoute,
	itemsRoute,
	ladderRoute,
	profileRoute,
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
