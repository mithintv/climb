import { FilterXIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { STAT_FILTER_GROUPS } from "../constants/stat-filter.constant";

// The client's own rail icons, sliced out of its texture atlas
// (`game/assets/ux/itemshop/itemshop_texture_atlas4.png` on CommunityDragon).
// Data Dragon serves no stat art at all — every `/img/ui/*` path 403s — and the
// atlas is packed without a manifest, so the glyphs are committed as files
// rather than hotlinked and re-sliced on every patch.
//
// The atlas carries five colour variants per stat. Two are used: the neutral
// grey the rail sits in, and the coloured one that marks a filter as on. Both
// sets share a filename per stat, so they are read off disk by name instead of
// through 28 hand-written imports.

/**
 * Key one variant directory's glob result by item type, reducing each module
 * path to the bare filename the colour and grey sets share
 * (`.../mono/on-hit.png` → `on-hit`), which is also the key the rail filters on.
 */
const byItemType = (modules: Record<string, unknown>): Record<string, string> =>
	Object.fromEntries(
		Object.entries(modules).map(([path, url]) => [
			path.slice(path.lastIndexOf("/") + 1, -".png".length),
			url as string,
		]),
	);

/** Icon per item type, coloured — the state a selected filter is drawn in. */
const ITEM_TYPE_ICONS_COLOR = byItemType(
	import.meta.glob("../../../assets/icons/item-tags/color/*.png", {
		eager: true,
		import: "default",
		query: "?url",
	}),
);

/** Icon per item type, grey — the rail's resting state. */
const ITEM_TYPE_ICONS_MONO = byItemType(
	import.meta.glob("../../../assets/icons/item-tags/mono/*.png", {
		eager: true,
		import: "default",
		query: "?url",
	}),
);

interface IItemTagRailProps {
	selected: string[];
	onToggle: (key: string) => void;
	onClear: () => void;
}

export const ItemTagRail = (props: IItemTagRailProps) => (
	<nav
		aria-label="Filter by stat"
		className="flex w-12 shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-white/10 border-r py-3"
	>
		<button
			type="button"
			onClick={props.onClear}
			disabled={props.selected.length === 0}
			aria-label="Clear stat filters"
			title="Clear stat filters"
			className="flex size-9 items-center justify-center rounded-full border border-white/15 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
		>
			<FilterXIcon className="size-4" aria-hidden="true" />
		</button>

		{STAT_FILTER_GROUPS.map((group) => (
			<div
				key={group[0].key}
				// A rule above each group, matching the client — including the one
				// separating the first group from the clear button.
				className="mt-1.5 flex w-8 flex-col items-center gap-0 border-white/10 border-t pt-1.5"
			>
				{group.map((stat) => {
					const isSelected = props.selected.includes(stat.key);
					return (
						<button
							key={stat.key}
							type="button"
							aria-pressed={isSelected}
							aria-label={stat.label}
							title={stat.label}
							onClick={() => props.onToggle(stat.key)}
							// Selection reads off the icon itself — coloured when on, grey
							// when off — so the button carries no box of its own. The
							// atlas has no accent colour for Ability Haste or Movement,
							// only a cream glyph against the grey one, so the off state
							// is dimmed hard enough that those two still read as a change.
							className={cn(
								"flex size-9 items-center justify-center rounded-md transition-opacity",
								isSelected ? "opacity-100" : "opacity-45 hover:opacity-75",
							)}
						>
							<img
								src={
									isSelected
										? ITEM_TYPE_ICONS_COLOR[stat.key]
										: ITEM_TYPE_ICONS_MONO[stat.key]
								}
								alt=""
								className="size-5 object-contain"
							/>
						</button>
					);
				})}
			</div>
		))}
	</nav>
);
