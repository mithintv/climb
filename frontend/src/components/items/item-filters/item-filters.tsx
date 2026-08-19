import { ArrowUpDownIcon, SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";

import { ITEM_VERSIONS } from "../constants/item-version.constant";
import { SUMMONERS_RIFT_LABEL } from "../constants/shop-visibility.constant";
import type { IItemSearch } from "../types/i-item-search.type";
import type { ItemSort } from "../types/item-sort.type";
import { ITEM_TIER_TABS } from "./item-tier-tab.constant";

interface IItemFiltersProps {
	search: IItemSearch;
	version: string;
	resultCount: number;
	onChange: (patch: Partial<IItemSearch>) => void;
	onVersionChange: (version: string) => void;
}

export const ItemFilters = (props: IItemFiltersProps) => {
	const { search, onChange } = props;
	const sort: ItemSort = search.sort ?? "gold-asc";

	return (
		<div className="border-white/10 border-b">
			<div className="flex items-center gap-1 px-4 pt-2">
				<div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
					{ITEM_TIER_TABS.map((tab) => {
						const active = search.tier === tab.tier;
						return (
							<button
								key={tab.label}
								type="button"
								onClick={() => onChange({ tier: tab.tier })}
								aria-current={active ? "true" : undefined}
								className={cn(
									"shrink-0 border-b-2 px-3 py-2 text-sm transition-colors",
									active
										? "border-primary text-foreground"
										: "border-transparent text-muted-foreground hover:text-foreground",
								)}
							>
								{tab.label}
							</button>
						);
					})}
				</div>

				<div className="flex shrink-0 items-center gap-2 pb-2 pl-4">
					{/* One map today; it sits here so a picker can replace the label
					    without moving anything else. */}
					<span className="text-muted-foreground text-sm">
						{SUMMONERS_RIFT_LABEL}
					</span>
					<Select value={props.version} onValueChange={props.onVersionChange}>
						<SelectTrigger size="sm" aria-label="Patch">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{ITEM_VERSIONS.map((version) => (
								<SelectItem key={version} value={version}>
									{version}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex items-center gap-3 px-4 py-3">
				<div className="relative flex-1">
					<SearchIcon
						className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						type="search"
						value={search.q ?? ""}
						onChange={(event) =>
							onChange({ q: event.target.value || undefined })
						}
						placeholder="Search items"
						aria-label="Search items"
						className="pl-9"
					/>
				</div>
				<span className="shrink-0 text-muted-foreground text-xs">
					{props.resultCount} items
				</span>
				<button
					type="button"
					onClick={() =>
						onChange({ sort: sort === "gold-asc" ? "gold-desc" : "gold-asc" })
					}
					className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
					// The grid stays grouped by tier either way; this only orders items
					// inside each heading.
					title="Sort by gold within each tier"
				>
					<ArrowUpDownIcon className="size-4" aria-hidden="true" />
					{sort === "gold-asc" ? "Cheapest" : "Priciest"}
				</button>
			</div>
		</div>
	);
};
