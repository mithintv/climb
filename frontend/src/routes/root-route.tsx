import { createRootRoute, Outlet } from "@tanstack/react-router";

import { AppHeader } from "@/components/app-header/app-header";

/** The frame every page renders inside: the top nav and the route outlet. */
const RootLayout = () => (
	<>
		<AppHeader />
		<Outlet />
	</>
);

/** The route every other route hangs off. */
export const rootRoute = createRootRoute({ component: RootLayout });
