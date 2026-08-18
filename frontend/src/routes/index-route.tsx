import { createRoute } from "@tanstack/react-router";

import { SummonerName } from "@/components/summoner-name";

import { rootRoute } from "./root-route";

/** The summoner lookup the site opens on. */
const HomePage = () => <SummonerName />;

/** `/` */
export const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: HomePage,
});
