import 'dotenv/config';
import axios from 'axios';


export const fetchPUUID = async (gameName: string, tagLine: string = 'NA1') => {
  const account = await axios.get(`https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, {
    headers: {
      'X-Riot-Token': process.env.X_RIOT_TOKEN
    }
  });
  return account.data.puuid;
};

export const fetchMatchIds = async (puuid: string, start: number = 0, count: number = 5) => {
  const matches = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`, {
    headers: {
      'X-Riot-Token': process.env.X_RIOT_TOKEN
    }
  });
  return matches.data;
};

export const fetchMatchData = async (matchId: string) => {
	const match = await axios.get(
		`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}
  `,
		{
			headers: {
				"X-Riot-Token": process.env.X_RIOT_TOKEN,
			},
		},
	);
	return match.data;
};
