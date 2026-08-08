import express from "express";
import axios from "axios";

import {
	fetchPUUID,
	fetchMatchIds,
	fetchMatchData,
} from "./../controllers/riot.ts";

const errorStatus = (error: unknown) =>
	axios.isAxiosError(error) ? (error.response?.status ?? 500) : 500;

const errorMessage = (error: unknown) =>
	error instanceof Error ? error.message : String(error);

const router = express.Router();
router
	.get("/riot/puuid/:riotId", async (req, res) => {
		const [gameName, tagLine] = req.params.riotId.split("#");
		try {
			const puuid = await fetchPUUID(gameName, tagLine);
			res.status(200).json({ puuid: puuid });
		} catch (error) {
			console.error("Failed to fetch PUUID", errorMessage(error));
			res.status(errorStatus(error)).json({ error: "Failed to fetch PUUID" });
		}
	})
	.get("/riot/matches/:puuid", async (req, res) => {
		const start = Number(req.query.start) || 0;
		const count = Number(req.query.count) || 5;
		try {
			const matchIds = await fetchMatchIds(req.params.puuid, start, count);
			res.status(200).json(matchIds);
		} catch (error) {
			console.error("Failed to fetch matches", errorMessage(error));
			res.status(errorStatus(error)).json({ error: "Failed to fetch matches" });
		}
	})
	.get("/:summonerName/:matchId", async (req, res) => {
		const { matchId } = req.params;
		try {
			const matchData = await fetchMatchData(matchId);
			res.status(200).send(matchData);
		} catch (error) {
			console.error("Failed to fetch match notes", errorMessage(error));
			res
				.status(errorStatus(error))
				.json({ error: "Failed to fetch match notes" });
		}
	});

export default router;
