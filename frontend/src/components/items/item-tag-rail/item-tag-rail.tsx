import { FilterXIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { ITEM_TAG_FILTER_GROUPS } from "../constants/item-tag-filter.constant";

// The client's own rail icons, sliced out of its texture atlas
// (`game/assets/ux/itemshop/itemshop_texture_atlas4.png` on CommunityDragon).
// Data Dragon serves no tag art at all — every `/img/ui/*` path 403s — and the
// atlas is packed without a manifest, so the glyphs are committed as files
// rather than hotlinked and re-sliced on every patch.
//
// The atlas carries five colour variants per tag. Two are used: the neutral
// grey the rail sits in, and the coloured one that marks a filter as on. Both
// sets share a filename per tag, so they are read off disk by name instead of
// through 28 hand-written imports.

/**
 * Key one variant directory's glob result by item tag, reducing each module
 * path to the bare filename the colour and grey sets share
 * (`.../mono/on-hit.png` → `on-hit`), which is also the key the rail filters on.
 */
const byItemTag = (modules: Record<string, unknown>): Record<string, string> =>
	Object.fromEntries(
		Object.entries(modules).map(([path, url]) => [
			path.slice(path.lastIndexOf("/") + 1, -".png".length),
			url as string,
		]),
	);

/** Icon per item tag, coloured — the state a selected filter is drawn in. */
const ITEM_TAG_ICONS_COLOR = byItemTag(
	import.meta.glob("../../../assets/icons/item-tags/color/*.png", {
		eager: true,
		import: "default",
		query: "?url",
	}),
);

/** Icon per item tag, grey — the rail's resting state. */
const ITEM_TAG_ICONS_MONO = byItemTag(
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
		aria-label="Filter by tag"
		className="flex w-12 shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-white/10 border-r py-3"
	>
		<button
			type="button"
			onClick={props.onClear}
			disabled={props.selected.length === 0}
			aria-label="Clear tag filters"
			title="Clear tag filters"
			className="flex size-9 items-center justify-center rounded-full border border-white/15 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
		>
			<FilterXIcon className="size-4" aria-hidden="true" />
		</button>

		{ITEM_TAG_FILTER_GROUPS.map((group) => (
			<div
				key={group[0].key}
				// A rule above each group, matching the client — including the one
				// separating the first group from the clear button.
				className="mt-1.5 flex w-8 flex-col items-center gap-0 border-white/10 border-t pt-1.5"
			>
				{group.map((tag) => {
					const isSelected = props.selected.includes(tag.key);
					return (
						<button
							key={tag.key}
							type="button"
							aria-pressed={isSelected}
							aria-label={tag.label}
							title={tag.label}
							onClick={() => props.onToggle(tag.key)}
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
										? ITEM_TAG_ICONS_COLOR[tag.key]
										: ITEM_TAG_ICONS_MONO[tag.key]
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
