import { ITEM_VERSION } from "@/components/items/constants/item-version.constant";

/**
 * Shown for an unknown route, and for a patch the page cannot serve. Not a
 * route of its own — the router falls back to it.
 */
export const NotFound = () => (
	<main className="p-10 text-center text-muted-foreground">
		<p className="text-foreground text-lg">Not found</p>
		<p className="mt-2 text-sm">
			Only patch {ITEM_VERSION} is available until items move to the backend.
		</p>
	</main>
);
