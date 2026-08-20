import { useNavigate } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { type FormEvent, useState } from "react";

import { APP_HEADER_REGION } from "@/components/app-header/app-header-region.constant";

import { parseTypedRiotId, toRiotIdParam } from "./summoner.utils";

/**
 * The landing page: the wordmark over a lookup box, and nothing else.
 *
 * The same search as the header's, given the whole page because on `/` it is
 * the only thing to do. It resolves nothing itself — it routes to the profile,
 * so a looked-up player has a URL that can be shared, refreshed and gone back to.
 */
export const SummonerSearchHero = () => {
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
		<div className="page-gutter flex flex-col items-center pt-32">
			<h1 className="font-bold font-mono text-[28px] text-primary tracking-[.32em]">
				CLIMB
			</h1>
			<p className="mt-4 text-[12.5px] text-ink-secondary">
				Search a summoner. Review your games. Take notes. Climb.
			</p>

			<form
				onSubmit={submitHandler}
				className="mt-10 flex w-full max-w-[420px] items-center gap-3 rounded-[2px] border border-control bg-rail-hover px-4 py-3 focus-within:border-ink-label"
			>
				<span className="shrink-0 font-mono text-[10px] text-ink-label tracking-[.2em]">
					{APP_HEADER_REGION}
				</span>
				<input
					type="search"
					value={typedRiotId}
					onChange={(event) => setTypedRiotId(event.target.value)}
					placeholder="summoner #tag"
					aria-label="Search a summoner"
					className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-ink outline-hidden placeholder:text-ink-label"
				/>
				<button
					type="submit"
					aria-label="Search"
					className="shrink-0 text-ink-label transition-colors hover:text-ink"
				>
					<SearchIcon className="size-4" aria-hidden={true} />
				</button>
			</form>
		</div>
	);
};
