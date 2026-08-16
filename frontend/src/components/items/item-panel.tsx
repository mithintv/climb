import { getItem, type ShopItem } from "@/lib/items";

import { ItemDetails } from "../match/item-details";

/**
 * Cut a description in two at its first `<active>`, returning the part before
 * it and the active itself. Both halves are re-wrapped in `<mainText>` so the
 * existing parser sees the tag nesting it expects; an item with no active comes
 * back unchanged with an empty second half.
 */
const splitActive = (description: string): [string, string] => {
	const at = description.indexOf("<active>");
	if (at === -1) return [description, ""];
	const body = `${description.slice(0, at)}</mainText>`;
	// Data Dragon is inconsistent about labelling the active: some name it
	// ("Time Stop"), some just say "Active", some prefix the name ("Active -
	// Consume:"). The heading above the block says it once, so a leading
	// "Active" and its separator come off, and a span left empty is dropped.
	const active = `<mainText>${description.slice(at)}`.replace(
		/<active>Active\s*[-–—:]?\s*(.*?)<\/active>/i,
		(_, name: string) => (name ? `<active>${name}</active>` : ""),
	);
	// Trailing `<br>`s belong to the gap the split replaces.
	return [body.replace(/(<br>\s*)+<\/mainText>$/, "</mainText>"), active];
};

interface ItemPanelProps {
	version: string;
	item: ShopItem | undefined;
	onSelect: (id: string) => void;
}

export const ItemPanel = (props: ItemPanelProps) => {
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
		.filter((component): component is ShopItem => Boolean(component));
	const into = item.into
		.map((id) => getItem(version, id))
		.filter((upgrade): upgrade is ShopItem => Boolean(upgrade));

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
				<ItemDetails description={body} />
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
						<ItemDetails description={active} />
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

interface BuildRowProps {
	label: string;
	items: ShopItem[];
	onSelect: (id: string) => void;
	emptyHint?: string;
}

const BuildRow = (props: BuildRowProps) => {
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
