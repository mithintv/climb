import { useState } from "react";
import type { FormEvent } from "react";

import { MatchList } from "./match-list";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

// backend config
import { myConfig } from "../config/config";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3080";

const fetchPUUID = async (summonerName: string): Promise<string> => {
	console.log("request sent");
	const response = await fetch(
		`${backendUrl}/riot/puuid/${encodeURIComponent(summonerName)}`,
	);
	const data = await response.json();
	return data.puuid;
};

const fetchMatches = async (puuid: string): Promise<string[]> => {
	console.log("request sent");
	const response = await fetch(
		`${backendUrl}/riot/matches/${puuid}?start=0&count=5`,
	);
	const matchesArray = await response.json();
	if (!Array.isArray(matchesArray)) {
		console.error("Failed to fetch matches:", matchesArray);
		return [];
	}
	return matchesArray;
};

export const SummonerName = () => {
	const [puuid, setPuuid] = useState("");
	const [matches, setShowMatches] = useState<string[]>([]);
	const [summonerName, setSummonerName] = useState("");
	const submitHandler = async (event: FormEvent) => {
		event.preventDefault();
		const id = await fetchPUUID(summonerName || myConfig.summonerName);
		setPuuid(id);
		const matchHistory = await fetchMatches(id);
		setShowMatches(matchHistory);
	};

	const hasMatches = matches.length > 0;

	return (
		<div className="flex flex-col items-center px-4">
			<div
				className={`flex w-full flex-col items-center transition-all duration-300 ${hasMatches ? "mt-10" : "mt-36"}`}
			>
				<h1 className="bg-linear-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-6xl font-black tracking-tight text-transparent">
					Climb
				</h1>
				<p className="mt-3 text-sm text-slate-400">
					Search a summoner. Review your games. Take notes. Climb.
				</p>
				<form
					onSubmit={submitHandler}
					className="mt-8 flex w-136 max-w-full items-center rounded-full bg-white shadow-lg shadow-cyan-500/10 focus-within:ring-2 focus-within:ring-cyan-400"
				>
					<span className="ml-2 shrink-0 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-600">
						NA
					</span>
					<Input
						className="h-auto flex-1 border-0 bg-transparent px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:ring-0 dark:bg-transparent"
						placeholder={`Game Name #Tag (e.g. ${myConfig.summonerName})`}
						value={summonerName}
						onChange={(e) => setSummonerName(e.target.value)}
					/>
					<Button
						type="submit"
						className="m-1 h-auto rounded-full px-6 py-2 text-sm font-semibold"
					>
						Search
					</Button>
				</form>
			</div>
			{hasMatches && (
				<div className="mt-4 flex flex-col m-auto text-xs">
					<MatchList
						puuid={puuid}
						matches={matches}
						summonerName={summonerName || myConfig.summonerName}
					/>
				</div>
			)}
		</div>
	);
};
