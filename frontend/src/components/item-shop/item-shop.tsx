import { getRouteApi } from "@tanstack/react-router";
import { useMemo } from "react";

import { ItemFilters } from "./item-filters/item-filters";
import { ItemGrid } from "./item-grid/item-grid";
import { ItemPanel } from "./item-panel/item-panel";
import {
	filterItems,
	getItem,
	getShopItems,
	groupByTier,
} from "./item-shop.utils";
import { ItemTagRail } from "./item-tag-rail/item-tag-rail";
import type { IItemSearch } from "./types/i-item-search.type";

const route = getRouteApi("/items/$version");

export const ItemShop = () => {
	const { version } = route.useParams();
	const search = route.useSearch();
	const navigate = route.useNavigate();

	const items = useMemo(() => getShopItems(version), [version]);

	const filtered = useMemo(() => filterItems(items, search), [items, search]);
	const groups = useMemo(
		() => groupByTier(filtered, search.sort),
		[filtered, search.sort],
	);

	const selected = search.item ? getItem(version, search.item) : undefined;

	// replace: true keeps filter tweaks out of the back stack, so Back leaves
	// the shop rather than stepping through every tag that was tried.
	const setSearch = (patch: Partial<IItemSearch>) =>
		navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

	const toggleStat = (key: string) => {
		const selected = search.stats ?? [];
		const next = selected.includes(key)
			? selected.filter((current) => current !== key)
			: [...selected, key];
		setSearch({ stats: next.length > 0 ? next : undefined });
	};

	return (
		// The shop is a panel with room to breathe on both sides, not a page that
		// runs to the window edges — same shape as the client's own window.
		<main className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-6xl flex-col px-6 py-6">
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-card/40">
				<ItemFilters
					search={search}
					version={version}
					resultCount={filtered.length}
					onChange={setSearch}
					onVersionChange={(next) =>
						// Filters carry over to the new patch; a selected item may not
						// exist there, so it is dropped.
						navigate({
							to: "/items/$version",
							params: { version: next },
							search: { ...search, item: undefined },
						})
					}
				/>

				<div className="flex min-h-0 flex-1">
					<ItemTagRail
						selected={search.stats ?? []}
						onToggle={toggleStat}
						onClear={() => setSearch({ stats: undefined })}
					/>
					<div className="min-w-0 flex-1 overflow-y-auto">
						<ItemGrid
							groups={groups}
							selectedId={search.item}
							onSelect={(id) => setSearch({ item: id })}
						/>
					</div>
					<ItemPanel
						version={version}
						item={selected}
						onSelect={(id) => setSearch({ item: id })}
					/>
				</div>
			</div>
		</main>
	);
};
