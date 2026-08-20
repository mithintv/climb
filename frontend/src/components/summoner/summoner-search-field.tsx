import { useNavigate } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { type FormEvent, useState } from "react";

import { APP_HEADER_REGION } from "@/components/app-header/app-header-region.constant";

import { parseTypedRiotId, toRiotIdParam } from "./summoner.utils";

/**
 * The lookup box in the header, so a second summoner can be searched without
 * going back to the landing page.
 *
 * A form rather than a click handler: Enter is how a search box is used, and
 * wrapping the input gives that for free along with the search keyboard on a
 * phone. Like the landing page's hero, it resolves nothing itself — it routes,
 * so the profile it lands on has a shareable URL.
 */
export const SummonerSearchField = () => {
	const navigate = useNavigate();
	const [typedRiotId, setTypedRiotId] = useState("");

	const submitHandler = (event: FormEvent) => {
		event.preventDefault();
		const riotId = parseTypedRiotId(typedRiotId, APP_HEADER_REGION);
		if (!riotId) return;

		navigate({
			to: "/profile/$riotId",
			params: { riotId: toRiotIdParam(riotId.gameName, riotId.tagLine) },
		});
	};

	return (
		<form
			onSubmit={submitHandler}
			// Focus is drawn on the wrapper, not the input: the border is the
			// control's edge and the input inside it has none of its own.
			className="flex w-[220px] shrink-0 items-center gap-[9px] rounded-[2px] border border-control bg-rail-hover px-3 py-[7px] focus-within:border-ink-label"
		>
			<SearchIcon
				className="size-4 shrink-0 text-ink-label"
				aria-hidden={true}
			/>
			<input
				type="search"
				value={typedRiotId}
				onChange={(event) => setTypedRiotId(event.target.value)}
				placeholder="summoner #tag"
				aria-label="Search a summoner"
				className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-ink outline-hidden placeholder:text-ink-label"
			/>
		</form>
	);
};
