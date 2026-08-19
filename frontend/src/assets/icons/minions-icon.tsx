import type { SVGProps } from "react";

/**
 * Minion — the game's own `scoreboard-stat-switcher-minions-slain.svg`, taken
 * from CommunityDragon's `rcp-fe-lol-postgame` bundle and inlined rather than
 * hotlinked: the plugin repacks between patches, and the source file carries a
 * hardcoded `#A09B8C` fill. Inlined it takes `currentColor` and inherits the
 * text colour.
 *
 * Decorative — the figure beside it is labelled — so it is `aria-hidden`. The
 * attribute is written out rather than spread from a helper, because the lint
 * rule that requires it only sees literal props.
 */
export const MinionsIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		viewBox="0 0 20 20"
		fill="currentColor"
		aria-hidden="true"
		focusable="false"
		{...props}
	>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M10 3C8 3 8 7 4 11C6 14 9 17 10 17C11 17 14 14 16 11C12 7 12 3 10 3ZM10 15L7 10C6.7 9.5 7.5 8.7 8 9L10 10L12 9C12.5 8.7 13.3 9.5 13 10L10 15Z"
		/>
	</svg>
);
