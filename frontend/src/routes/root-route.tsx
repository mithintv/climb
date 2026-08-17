import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

import { ITEM_VERSION } from "@/components/item-shop/constants/item-version.constant";

/** The frame every page renders inside: the top nav and the route outlet. */
const RootLayout = () => (
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
				// The nav always points at the newest patch the page can serve.
				params={{ version: ITEM_VERSION }}
				className="text-muted-foreground text-sm transition-colors hover:text-foreground [&.active]:text-foreground"
			>
				Items
			</Link>
		</nav>
		<Outlet />
	</>
);

/** The route every other route hangs off. */
export const rootRoute = createRootRoute({ component: RootLayout });
