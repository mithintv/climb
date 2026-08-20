import { FlagIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import {
	MATCH_QUEST_REWARD_FALLBACK,
	MATCH_QUEST_REWARD_NAMES,
} from "./constants/match-quest-reward.constant";
import type { MatchSlotSize } from "./types/match-slot-size.type";

const itemImage = (item: number) =>
	`https://ddragon.leagueoflegends.com/cdn/16.15.1/img/item/${item}.png`;

/** Slot geometry and gap per size step. */
const ITEM_SLOT_CLASS: Record<MatchSlotSize, string> = {
	card: "size-[28px]",
	scoreboard: "size-[20px]",
};
const ITEM_GAP_CLASS: Record<MatchSlotSize, string> = {
	card: "gap-1",
	scoreboard: "gap-[3px]",
};

/**
 * The three columns, stated as the slot's own width rather than as `grid-cols-3`.
 *
 * `grid-cols-3` is `repeat(3, minmax(0, 1fr))`, whose tracks are free to resolve
 * narrower than their content. Preflight gives every image `max-width: 100%`
 * and nothing pins its height to its width, so a squeezed track shrank each
 * icon horizontally against a fixed height and the art came out visibly
 * stretched. Fixed tracks cannot squeeze, so the grid overflows its column
 * instead of distorting — which the pane's horizontal scroll already handles.
 */
const ITEM_GRID_CLASS: Record<MatchSlotSize, string> = {
	card: "grid-cols-[repeat(3,28px)]",
	scoreboard: "grid-cols-[repeat(3,20px)]",
};

interface IMatchItemsProps {
	/** The seven inventory slots: six items followed by the trinket. */
	items: number[];
	/**
	 * The lane quest reward, when the match has one. Riot added `roleBoundItem`
	 * in patch 16.12, so older matches and Arena games pass nothing.
	 */
	questReward?: number | null;
	size: MatchSlotSize;
}

/**
 * A player's finished inventory: six bought items in a 3×2 block, with the
 * trinket and the lane quest reward in a fourth column beside it.
 *
 * Empty slots are drawn rather than collapsed, so five items and six read
 * differently at a glance and every row in a scoreboard is the same width.
 */
export const MatchItems = (props: IMatchItemsProps) => {
	const bought = props.items.slice(0, 6);
	const trinket = props.items[6];
	const questName = props.questReward
		? (MATCH_QUEST_REWARD_NAMES[props.questReward] ??
			MATCH_QUEST_REWARD_FALLBACK)
		: null;

	const slot = ITEM_SLOT_CLASS[props.size];
	const gap = ITEM_GAP_CLASS[props.size];
	const emptySlot = cn(slot, "rounded-[1px] border border-slot-edge bg-slot");

	/**
	 * One inventory icon. Item names are not bundled, so these are decorative.
	 *
	 * `object-cover` on a square slot holding square source art is a no-op today
	 * — it is there so a non-square icon crops rather than stretches, which is
	 * the failure the fixed tracks above already rule out one way.
	 */
	const itemIcon = (item: number, label?: string) => (
		<img
			src={itemImage(item)}
			alt={label ?? ""}
			title={label}
			loading="lazy"
			className={cn(slot, "rounded-[1px] border border-slot-edge object-cover")}
		/>
	);

	return (
		<div className={cn("flex shrink-0 items-center", gap)}>
			{/* Item names live in backend/assets/item.json, which is too large to
			    pull into the bundle for alt text alone, so the grid is labelled as a
			    whole and the icons are marked decorative until the assets move to
			    the backend. */}
			<ul
				className={cn("grid", ITEM_GRID_CLASS[props.size], gap)}
				aria-label="Items"
			>
				{bought.map((item, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: inventory slots are positional
					<li key={index}>
						{item === 0 ? <div className={emptySlot} /> : itemIcon(item)}
					</li>
				))}
			</ul>

			{/* The fourth column holds the two icons that are not bought inventory.
			    The quest reward is never one of item0-6, so putting it in the grid
			    would imply a slot it never occupied. */}
			<ul
				className={cn("flex flex-col", gap)}
				aria-label="Trinket and lane quest"
			>
				<li>
					{trinket === 0 ? (
						<div className={cn(emptySlot, "rounded-full")} />
					) : (
						// Round, so the trinket is not mistaken for a seventh item.
						<img
							src={itemImage(trinket)}
							alt=""
							loading="lazy"
							className={cn(
								slot,
								"rounded-full border border-slot-edge object-cover",
							)}
						/>
					)}
				</li>
				<li>
					{props.questReward && questName ? (
						itemIcon(props.questReward, questName)
					) : (
						// Held rather than collapsed, so a pre-16.12 match keeps the same
						// grid shape as the games above it in the list. The gold frame is
						// the page's mark for anything quest-related.
						<div
							className={cn(
								slot,
								"grid place-items-center rounded-[1px] border border-quest-edge bg-quest-slot",
							)}
						>
							<FlagIcon
								className="size-[60%] text-gold opacity-40"
								aria-hidden={true}
							/>
						</div>
					)}
				</li>
			</ul>
		</div>
	);
};
