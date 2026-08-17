import type { IShopItem } from "../types/i-shop-item.type";

interface IBuildRowProps {
	label: string;
	items: IShopItem[];
	onSelect: (id: string) => void;
	emptyHint?: string;
}

export const BuildRow = (props: IBuildRowProps) => {
	if (props.items.length === 0 && !props.emptyHint) return null;

	return (
		<section className="mt-5">
			<h3 className="mb-2 font-semibold text-muted-foreground text-xs tracking-[0.2em]">
				{props.label}
			</h3>
			{props.items.length === 0 ? (
				<p className="text-muted-foreground text-xs">{props.emptyHint}</p>
			) : (
				<ul className="flex flex-wrap gap-2">
					{props.items.map((item) => (
						<li key={item.id}>
							<button
								type="button"
								onClick={() => props.onSelect(item.id)}
								title={`${item.name} — ${item.gold.total} gold`}
							>
								<img
									src={item.iconUrl}
									alt={item.name}
									width={40}
									height={40}
									loading="lazy"
									className="size-10 rounded-md border border-white/10 transition-colors hover:border-white/40"
								/>
							</button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
};
