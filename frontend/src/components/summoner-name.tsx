import { useState } from "react";

import { MatchList } from "./match-list";

// backend config
import { myConfig } from "../config/config";

// layout
import { Button } from "./../layout/button";

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
	const clickHandler = async () => {
		const id = await fetchPUUID(summonerName || myConfig.summonerName);
		setPuuid(id);
		const matchHistory = await fetchMatches(id);
		setShowMatches(matchHistory);
	};

	return (
		<div className="flex flex-col items-center mt-10 m-auto">
			<input
				className="rounded-full w-96 outline-0 px-3 py-1 my-2"
				value={summonerName}
				onChange={(e) => setSummonerName(e.target.value)}
			></input>
			<Button onClick={clickHandler}>Search</Button>
			<div className="mt-4 flex flex-col m-auto text-xs">
				<MatchList
					puuid={puuid}
					matches={matches}
					summonerName={summonerName || myConfig.summonerName}
				/>
			</div>
		</div>
	);
};
