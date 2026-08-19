import {
	QUEST_REWARD_FALLBACK,
	QUEST_REWARD_NAMES,
} from "./quest-reward.constant";

const itemImage = (item: number) => {
	return `https://ddragon.leagueoflegends.com/cdn/16.15.1/img/item/${item}.png`;
};

/** An empty inventory slot, drawn so five items and six read differently. */
const EmptySlot = () => (
	<div className="size-7 rounded border border-white/8 bg-black/25" />
);

/** One inventory icon. Item names are not bundled, so these are decorative. */
const ItemIcon = (props: { item: number; label?: string }) => (
	<img
		src={itemImage(props.item)}
		alt={props.label ?? ""}
		title={props.label}
		loading="lazy"
		className="size-7 rounded border border-white/10"
	/>
);

interface ItemsProps {
	/** The seven inventory slots: six items followed by the trinket. */
	items: number[];
	/**
	 * The lane quest reward, when the match has one. Riot added `roleBoundItem`
	 * in patch 16.12, so older matches and Arena games pass nothing.
	 */
	questReward?: number | null;
}

export const Items = (props: ItemsProps) => {
	const bought = props.items.slice(0, 6);
	const trinket = props.items[6];
	const questName = props.questReward
		? (QUEST_REWARD_NAMES[props.questReward] ?? QUEST_REWARD_FALLBACK)
		: null;

	return (
		<div className="flex shrink-0 gap-1">
			{/* Three across, so the six bought items are two rows rather than one
			    long strip — the card is a fixed-height row and the width saved here
			    goes to the team lists. */}
			{/* Item names live in backend/assets/item.json, which is too large to
			    pull into the bundle for alt text alone, so the grid is labelled as a
			    whole and the icons are marked decorative until the assets move to
			    the backend. */}
			<ul className="grid grid-cols-3 gap-0.5" aria-label="Items">
				{bought.map((item, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: inventory slots are positional
					<li key={index}>
						{item === 0 ? <EmptySlot /> : <ItemIcon item={item} />}
					</li>
				))}
			</ul>

			{/* The fourth column holds the two icons that are not bought inventory.
			    The quest reward is never one of item0-6, so putting it in the grid
			    would imply a slot it never occupied. */}
			<ul className="flex flex-col gap-0.5" aria-label="Trinket and lane quest">
				<li>{trinket === 0 ? <EmptySlot /> : <ItemIcon item={trinket} />}</li>
				<li>
					{props.questReward && questName ? (
						<ItemIcon item={props.questReward} label={questName} />
					) : (
						// Held rather than collapsed, so a pre-16.12 match keeps the same
						// grid shape as the games above it in the list.
						<div className="size-7 rounded border border-white/5" />
					)}
				</li>
			</ul>
		</div>
	);
};
