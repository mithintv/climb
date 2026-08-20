import { Link, type LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface IAppHeaderNavLinkProps extends LinkProps {
	/** The glyph naming the destination, sized by the link itself. */
	icon: LucideIcon;
	label: string;
	/**
	 * Lights the link up for a route it does not itself point at. Needed for
	 * Profile, whose real URL carries a riot id the header does not have, so it
	 * links at the lookup and claims the profile pages the lookup leads to.
	 */
	isActive?: boolean;
}

/**
 * One destination in the header nav: a glyph and its word, dim until the route
 * is active or the cursor is on it.
 *
 * The icon is passed as a component rather than rendered by the caller so every
 * link in the row is the same 17px — an icon sized at the call site is an icon
 * that drifts.
 */
export const AppHeaderNavLink = (props: IAppHeaderNavLinkProps) => {
	const { icon: Icon, label, isActive, ...linkProps } = props;

	return (
		<Link
			{...linkProps}
			// The router adds `.active` on an exact path match; `isActive` adds the
			// same class by hand, so both routes style through one rule rather than
			// two that have to be kept in step.
			className={cn(
				"group flex items-center gap-[7px] text-[13px] text-ink-tertiary transition-colors hover:text-ink [&.active]:text-ink",
				isActive && "active",
			)}
		>
			{/* The active link's glyph goes teal along with its word, which is the
			    only colour in the row and so is what the eye finds first. */}
			<Icon
				className="size-[17px] group-[.active]:text-primary"
				aria-hidden={true}
			/>
			{label}
		</Link>
	);
};
