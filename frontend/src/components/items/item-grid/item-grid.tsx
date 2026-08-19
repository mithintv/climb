import type { ITierGroup } from "../types/i-tier-group.type";
import { ItemTile } from "./item-tile";

interface IItemGridProps {
	groups: ITierGroup[];
	selectedId: string | undefined;
	onSelect: (id: string) => void;
}

export const ItemGrid = (props: IItemGridProps) => {
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
