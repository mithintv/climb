import { createRoute } from "@tanstack/react-router";

import { SummonerSearchHero } from "@/components/summoner/summoner-search-hero";

import { rootRoute } from "./root-route";

/** The summoner lookup the site opens on. */
const HomePage = () => <SummonerSearchHero />;

/** `/` */
export const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: HomePage,
});
