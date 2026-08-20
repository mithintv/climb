import { Link, useRouterState } from "@tanstack/react-router";
import {
	ListOrderedIcon,
	RadioIcon,
	ShieldIcon,
	SwordsIcon,
	UserIcon,
} from "lucide-react";

import { ITEM_VERSION } from "@/components/items/constants/item-version.constant";
import { SummonerSearchField } from "@/components/summoner/summoner-search-field";

import { AppHeaderNavLink } from "./app-header-nav-link";
import { APP_HEADER_REGION } from "./app-header-region.constant";

/**
 * `16.15.1` → `16.15`. The header states which patch the data is from, and the
 * hotfix digit is noise there — it changes weekly and nothing on the page reads
 * differently because of it.
 */
const shortPatch = (version: string) =>
	version.split(".").slice(0, 2).join(".");

/**
 * The bar every page sits under: wordmark, the four destinations, a summoner
 * lookup, and which realm and patch the numbers below come from.
 *
 * Exactly 60px tall and never scrolls, which is what lets the profile page
 * below it be `100vh - 60px` and own its own scrolling entirely.
 */
export const AppHeader = () => {
	// Read rather than matched against a route, because Profile's nav entry and
	// the page it claims have different paths — see the link below.
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const onProfile = pathname.startsWith("/profile");

	return (
		<header className="page-gutter flex h-[60px] shrink-0 items-center gap-[34px] border-edge border-b">
			<Link
				to="/"
				className="font-bold font-mono text-[14px] text-primary tracking-[.32em]"
			>
				CLIMB
			</Link>

			<nav className="flex items-center gap-[22px]">
				{/* Profile has no destination without a summoner to show, so it points at
			    the lookup — but it owns the profile pages that lookup leads to, and
			    lights up on them. */}
				<AppHeaderNavLink
					to="/"
					icon={UserIcon}
					label="Profile"
					isActive={onProfile}
				/>
				<AppHeaderNavLink
					to="/items/$version"
					// The nav always points at the newest patch the page can serve.
					params={{ version: ITEM_VERSION }}
					icon={ShieldIcon}
					label="Items"
				/>
				<AppHeaderNavLink to="/champions" icon={SwordsIcon} label="Champions" />
				<AppHeaderNavLink to="/ladder" icon={ListOrderedIcon} label="Ladder" />
			</nav>

			<div className="flex-1" />

			<SummonerSearchField />

			<div className="flex shrink-0 items-center gap-2 font-mono text-[10px] text-ink-muted tracking-[.14em]">
				<RadioIcon className="size-[15px] text-primary" aria-hidden={true} />
				{APP_HEADER_REGION} · {shortPatch(ITEM_VERSION)}
			</div>
		</header>
	);
};
