import { createRoute } from "@tanstack/react-router";

import { RoutePlaceholder } from "@/components/route-placeholder/route-placeholder";

import { rootRoute } from "./root-route";

/** Stands in until a ranked ladder is served; see the redesign ticket. */
const LadderPage = () => (
	<RoutePlaceholder
		title="Ladder"
		summary="The ranked ladder needs an endpoint that pages Riot's league lists."
	/>
);

/** `/ladder` */
export const ladderRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/ladder",
	component: LadderPage,
});
