import { createRoute } from "@tanstack/react-router";

import { SummonerSearch } from "@/components/summoner/summoner-search";

import { rootRoute } from "./root-route";

/** The summoner lookup the site opens on. */
const HomePage = () => <SummonerSearch />;

/** `/` */
export const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: HomePage,
});
