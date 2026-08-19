import { cn } from "@/lib/utils";

import type { IShopItem } from "../types/i-shop-item.type";

interface IItemTileProps {
	item: IShopItem;
	selected: boolean;
	onSelect: (id: string) => void;
}

export const ItemTile = (props: IItemTileProps) => {
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
