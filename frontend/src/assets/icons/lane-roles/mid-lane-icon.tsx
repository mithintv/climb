import type { SVGProps } from "react";

/**
 * Mid lane — the client's own position icon, inlined so it takes `currentColor`
 * (the source file carries a hardcoded lavender pair, which is off the page's
 * palette entirely).
 *
 * The diagonal is the lit tone, the two corners it runs between the shaded one
 * at 55%.
 */
export const MidLaneIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		viewBox="0 0 16 16"
		fill="currentColor"
		aria-hidden="true"
		focusable="false"
		{...props}
	>
		<path
			opacity=".55"
			d="M10.56 0H0V10.56L2.51429 7.90857V2.37714H8.18286L10.56 0Z"
		/>
		<path
			opacity=".55"
			d="M5.44 15.8629H16V5.30286L13.5314 7.95429V13.3943H7.81715L5.44 15.8629Z"
		/>
		<path d="M0.137146 12.7086V15.8629H3.29143L16 3.06286V0.0457153H12.9371C12.8914 0.0457153 0.137146 12.7086 0.137146 12.7086Z" />
	</svg>
);
