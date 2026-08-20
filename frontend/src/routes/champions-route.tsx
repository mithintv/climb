import { createRoute } from "@tanstack/react-router";

import { RoutePlaceholder } from "@/components/route-placeholder/route-placeholder";

import { rootRoute } from "./root-route";

/** Stands in until champion data is served; see the redesign ticket. */
const ChampionsPage = () => (
	<RoutePlaceholder
		title="Champions"
		summary="Champion pages need the roster in the backend database first."
	/>
);

/** `/champions` */
export const championsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/champions",
	component: ChampionsPage,
});
