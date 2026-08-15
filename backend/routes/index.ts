import express from "express";
import axios from "axios";

import {
	fetchPUUID,
	fetchMatchIds,
	fetchMatchData,
} from "./../controllers/riot.ts";

const errorStatus = (error: unknown) =>
	axios.isAxiosError(error) ? (error.response?.status ?? 500) : 500;

const router = express.Router();
router
	.get("/riot/puuid/:riotId", async (req, res) => {
		const [gameName, tagLine] = req.params.riotId.split("#");
		try {
			const puuid = await fetchPUUID(gameName, tagLine);
			req.log.debug(
				{ gameName, tagLine, puuid },
				"Resolved PUUID for {gameName}#{tagLine}",
			);
			res.status(200).json({ puuid: puuid });
		} catch (error) {
			const status = errorStatus(error);
			req.log.error(
				{ err: error, gameName, tagLine, status },
				"Failed to fetch PUUID for {gameName}#{tagLine} ({status})",
			);
			res.status(status).json({ error: "Failed to fetch PUUID" });
		}
	})
	.get("/riot/matches/:puuid", async (req, res) => {
		const { puuid } = req.params;
		const start = Number(req.query.start) || 0;
		const count = Number(req.query.count) || 5;
		try {
			const matchIds = await fetchMatchIds(puuid, start, count);
			req.log.debug(
				{ puuid, start, count, returned: matchIds.length },
				"Fetched {returned} match ids (start={start}, count={count})",
			);
			res.status(200).json(matchIds);
		} catch (error) {
			const status = errorStatus(error);
			req.log.error(
				{ err: error, puuid, start, count, status },
				"Failed to fetch matches for {puuid} ({status})",
			);
			res.status(status).json({ error: "Failed to fetch matches" });
		}
	})
	.get("/:summonerName/:matchId", async (req, res) => {
		const { summonerName, matchId } = req.params;
		try {
			const matchData = await fetchMatchData(matchId);
			req.log.debug(
				{ summonerName, matchId },
				"Fetched match data for {matchId}",
			);
			res.status(200).send(matchData);
		} catch (error) {
			const status = errorStatus(error);
			req.log.error(
				{ err: error, summonerName, matchId, status },
				"Failed to fetch match notes for {matchId} ({status})",
			);
			res.status(status).json({ error: "Failed to fetch match notes" });
		}
	});

export default router;
