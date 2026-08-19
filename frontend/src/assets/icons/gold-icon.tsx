import type { SVGProps } from "react";

/**
 * Coin stack — the game's own `scoreboard-coins-icon.svg`, taken from
 * CommunityDragon's `rcp-fe-lol-postgame` bundle and inlined rather than
 * hotlinked: the plugin repacks between patches, and the source file carries a
 * hardcoded `#A09B8C` fill. Inlined it takes `currentColor` and inherits the
 * text colour.
 *
 * Decorative — the figure beside it is labelled — so it is `aria-hidden`. The
 * attribute is written out rather than spread from a helper, because the lint
 * rule that requires it only sees literal props.
 */
export const GoldIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		viewBox="0 0 16 16"
		fill="currentColor"
		aria-hidden="true"
		focusable="false"
		{...props}
	>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M4.79981 7.20035V5.60004C4.79981 5.60004 5.5639 3.2002 9.59964 3.2002C11.2267 3.2002 13.5999 4.03333 13.5999 5.60004V7.20035C13.5649 7.70492 13.399 8.19165 13.1184 8.6125C12.8379 9.03335 12.4525 9.37378 12.0002 9.6002C12.0002 9.6002 11.3779 12.8002 6.40017 12.8002C3.97848 12.8002 2.3999 11.1644 2.3999 10.3997V9.6002C2.3999 8.57729 3.81546 7.20035 4.79981 7.20035ZM7.19973 11.2005C9.31528 11.2005 9.59964 9.60082 9.59964 9.60082H8.80008C6.38648 9.60019 5.59999 8.80004 5.59999 8.80004C5.59999 8.80004 4.00026 8.21455 4.00026 9.6002C3.99964 10.4308 5.29386 11.1999 7.19973 11.1999V11.2005Z"
		/>
	</svg>
);
