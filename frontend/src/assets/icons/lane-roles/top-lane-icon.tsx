import type { SVGProps } from "react";

/**
 * Top lane — the client's own position icon, inlined so it takes `currentColor`
 * (the source file carries a hardcoded lavender pair, which is off the page's
 * palette entirely).
 *
 * Two tones, as every lane icon is: the lit face at full strength and the shaded
 * one at 55%, which is what keeps the corner reading as a corner rather than as
 * a flat glyph. Both are the inherited colour, so a single text class colours
 * the whole icon.
 */
export const TopLaneIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		viewBox="0 0 16 16"
		fill="currentColor"
		aria-hidden="true"
		focusable="false"
		{...props}
	>
		<rect
			x="6.08002"
			y="6.07999"
			width="4.34286"
			height="4.34286"
			opacity=".55"
		/>
		<path
			opacity=".55"
			d="M1.87427 15.8629H16V1.73715L13.3486 4.38858V13.4857H4.25141L1.87427 15.8629Z"
		/>
		<path d="M0 14.72V0H14.6743L11.7029 2.97143H3.06286V11.7029C3.06286 11.6571 0 14.8114 0 14.72Z" />
	</svg>
);
