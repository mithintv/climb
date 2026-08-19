import { MatchItemDetails } from "../../matches/match-item-details";
import { getItem } from "../item-shop.utils";
import type { IShopItem } from "../types/i-shop-item.type";
import { BuildRow } from "./build-row";
import { splitActive } from "./item-panel.utils";

interface IItemPanelProps {
	version: string;
	item: IShopItem | undefined;
	onSelect: (id: string) => void;
}

export const ItemPanel = (props: IItemPanelProps) => {
	const { item, version } = props;

	if (!item) {
		return (
			<aside className="hidden w-80 shrink-0 border-white/10 border-l p-4 text-muted-foreground text-sm lg:block">
				Select an item to see what it builds from and into.
			</aside>
		);
	}

	// A component or upgrade can sit outside the shop set (another map, or an
	// alternate-mode copy), so these resolve against the whole patch.
	const from = item.from
		.map((id) => getItem(version, id))
		.filter((component): component is IShopItem => Boolean(component));
	const into = item.into
		.map((id) => getItem(version, id))
		.filter((upgrade): upgrade is IShopItem => Boolean(upgrade));

	const [body, active] = splitActive(item.description);

	return (
		<aside className="hidden w-80 shrink-0 overflow-y-auto border-white/10 border-l p-4 lg:block">
			<div className="flex items-center gap-3">
				<img
					src={item.iconUrl}
					alt=""
					width={48}
					height={48}
					className="size-12 rounded-md border border-white/10"
				/>
				<div>
					<h2 className="font-semibold text-foreground">{item.name}</h2>
					<p className="text-muted-foreground text-xs tabular-nums">
						{item.gold.total} gold
						{item.from.length > 0 && ` · ${item.gold.base} to combine`}
					</p>
				</div>
			</div>

			<div className="mt-4 text-sm leading-relaxed">
				<MatchItemDetails description={body} />
			</div>
			{active && (
				// Data Dragon separates the active with `<br>`s inside one blob,
				// which reads as a run-on next to the stats. Split it off so it
				// starts its own block whatever the markup does.
				<div className="mt-3 border-white/10 border-t pt-3">
					<h3 className="mb-1 font-semibold text-muted-foreground text-xs tracking-[0.2em]">
						ACTIVE
					</h3>
					<div className="text-sm leading-relaxed">
						<MatchItemDetails description={active} />
					</div>
				</div>
			)}

			<BuildRow
				label="Builds from"
				items={from}
				onSelect={props.onSelect}
				emptyHint="Bought outright."
			/>
			<BuildRow label="Builds into" items={into} onSelect={props.onSelect} />
		</aside>
	);
};
