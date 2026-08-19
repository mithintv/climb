import { useNavigate } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

import { toRiotIdParam } from "./summoner.utils";

/**
 * The search box. It resolves nothing itself — it routes to the profile, so a
 * looked-up player has a URL that can be shared, refreshed and gone back to.
 */
export const SummonerSearch = () => {
	const navigate = useNavigate();
	const [typedRiotId, setTypedRiotId] = useState("");

	const submitHandler = (event: FormEvent) => {
		event.preventDefault();
		const typed = typedRiotId.trim();
		if (!typed) return;

		// A tag is optional in the box; NA1 is the default the backend uses too.
		const [gameName, tagLine = "NA1"] = typed.split("#");
		if (!gameName) return;

		navigate({
			to: "/summoner/$riotId",
			params: { riotId: toRiotIdParam(gameName, tagLine) },
		});
	};

	return (
		<div className="flex flex-col items-center px-4">
			<div className="mt-36 flex w-full flex-col items-center">
				<h1 className="bg-linear-to-r from-teal-200 via-teal-400 to-emerald-500 bg-clip-text font-black text-6xl text-transparent tracking-tight">
					Climb
				</h1>
				<p className="mt-3 text-slate-400 text-sm">
					Search a summoner. Review your games. Take notes. Climb.
				</p>
				<form
					onSubmit={submitHandler}
					className="mt-8 flex w-136 max-w-full items-center rounded-full bg-white shadow-teal-500/15 shadow-lg focus-within:ring-2 focus-within:ring-teal-400"
				>
					<span className="ml-2 shrink-0 rounded-full bg-teal-100 px-3 py-1 font-bold text-teal-700 text-xs">
						NA
					</span>
					<Input
						className="h-auto flex-1 border-0 bg-transparent px-3 py-3 text-slate-800 text-sm placeholder:text-slate-400 focus-visible:ring-0 dark:bg-transparent"
						placeholder="Game Name #Tag"
						value={typedRiotId}
						onChange={(e) => setTypedRiotId(e.target.value)}
					/>
					<Button
						type="submit"
						className="m-1 h-auto rounded-full px-6 py-2 font-semibold text-sm"
					>
						Search
					</Button>
				</form>
			</div>
		</div>
	);
};
