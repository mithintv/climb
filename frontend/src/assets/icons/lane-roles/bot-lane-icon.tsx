import type { SVGProps } from "react";

/**
 * Bot lane — the client's own position icon, inlined so it takes `currentColor`
 * (the source file carries a hardcoded lavender pair, which is off the page's
 * palette entirely).
 *
 * The far corner is the lit tone, the near corner and its inner square the
 * shaded one at 55%.
 */
export const BotLaneIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		viewBox="0 0 16 16"
		fill="currentColor"
		aria-hidden="true"
		focusable="false"
		{...props}
	>
		<rect
			x="5.62286"
			y="5.48572"
			width="4.34286"
			height="4.34286"
			opacity=".55"
		/>
		<path
			opacity=".55"
			d="M14.1257 0H0V14.1257L2.65143 11.4743V2.37714H11.7486L14.1257 0Z"
		/>
		<path d="M16 1.14285V15.8628H1.32568L4.29711 12.8914H12.9371V4.20571C12.9371 4.20571 16 1.05142 16 1.14285Z" />
	</svg>
);
