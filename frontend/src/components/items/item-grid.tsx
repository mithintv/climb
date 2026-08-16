import type { ShopItem, TierGroup } from "@/lib/items";
import { cn } from "@/lib/utils";

interface ItemGridProps {
	groups: TierGroup[];
	selectedId: string | undefined;
	onSelect: (id: string) => void;
}

export const ItemGrid = (props: ItemGridProps) => {
	if (props.groups.length === 0) {
		return (
			<p className="p-10 text-center text-muted-foreground text-sm">
				No items match these filters.
			</p>
		);
	}

	return (
		<div className="space-y-6 p-4">
			{props.groups.map((group) => (
				<section key={group.tier} aria-labelledby={`tier-${group.tier}`}>
					<h2
						id={`tier-${group.tier}`}
						className="mb-2 font-semibold text-muted-foreground text-xs tracking-[0.2em]"
					>
						{group.tier}
					</h2>
					<ul className="flex flex-wrap gap-1.5">
						{group.items.map((item) => (
							<li key={item.id}>
								<ItemTile
									item={item}
									selected={item.id === props.selectedId}
									onSelect={props.onSelect}
								/>
							</li>
						))}
					</ul>
				</section>
			))}
		</div>
	);
};

interface ItemTileProps {
	item: ShopItem;
	selected: boolean;
	onSelect: (id: string) => void;
}

export const ItemTile = (props: ItemTileProps) => {
	const { item } = props;
	return (
		<button
			type="button"
			onClick={() => props.onSelect(item.id)}
			aria-pressed={props.selected}
			className="flex w-14 flex-col items-center gap-1"
			title={item.name}
		>
			<img
				src={item.iconUrl}
				alt={item.name}
				width={48}
				height={48}
				loading="lazy"
				className={cn(
					"size-12 rounded-md border transition-colors",
					props.selected
						? "border-primary"
						: "border-white/10 hover:border-white/40",
				)}
			/>
			<span className="text-[11px] text-muted-foreground tabular-nums">
				{item.gold.total === 0 ? "Free" : item.gold.total}
			</span>
		</button>
	);
};
