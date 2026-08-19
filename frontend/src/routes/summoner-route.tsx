import { createRoute } from "@tanstack/react-router";
import { HistoryIcon } from "lucide-react";

import { MatchList } from "@/components/matches/match-list";
import {
	entryForQueue,
	FLEX_QUEUE,
	parseRiotIdParam,
	SOLO_QUEUE,
} from "@/components/summoner/summoner.utils";
import { SummonerChampionStats } from "@/components/summoner/summoner-champion-stats";
import { SummonerHeader } from "@/components/summoner/summoner-header";
import { SummonerRankCard } from "@/components/summoner/summoner-rank-card";
import { SummonerRecentSummary } from "@/components/summoner/summoner-recent-summary";
import { useSummoner } from "@/components/summoner/use-summoner";

import { rootRoute } from "./root-route";

/** A player's profile: current rank, champion form, and recent games. */
const SummonerPage = () => {
	const { riotId } = summonerRoute.useParams();
	const { gameName, tagLine } = parseRiotIdParam(riotId);
	const { account, ranks, matches, loading, error } = useSummoner(
		gameName,
		tagLine,
	);

	if (error) {
		return (
			<div className="mx-auto max-w-4xl px-4 py-16 text-center">
				<p className="font-medium text-foreground">{error}</p>
				<p className="mt-1 text-muted-foreground text-sm">
					{gameName}#{tagLine}
				</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-6xl px-4 py-6">
			{/* Identity and rank share the rail, so nothing spans the top and the
			    match list starts at the page's first line — the games are what the
			    page is for, and they get its full height. One column below lg,
			    where a 300px rail would leave the rows too narrow to read. */}
			<div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
				<aside className="flex flex-col gap-4">
					<SummonerHeader
						// Riot's casing once the account resolves; until then, what was typed.
						gameName={account?.gameName ?? gameName}
						tagLine={account?.tagLine ?? tagLine}
					/>

					<SummonerRankCard
						queueLabel="Ranked Solo"
						entry={entryForQueue(ranks, SOLO_QUEUE)}
					/>
					<SummonerRankCard
						queueLabel="Ranked Flex"
						entry={entryForQueue(ranks, FLEX_QUEUE)}
					/>
					{account && matches.length > 0 && (
						<SummonerChampionStats matches={matches} puuid={account.puuid} />
					)}
				</aside>

				<main className="flex flex-col gap-2">
					<h2 className="flex items-center gap-2 px-1 font-semibold text-foreground text-sm">
						<HistoryIcon
							className="size-3.5 text-cyan-400"
							aria-hidden="true"
						/>
						Match History
					</h2>

					{account && (
						<SummonerRecentSummary matches={matches} puuid={account.puuid} />
					)}

					<MatchList
						puuid={account?.puuid ?? ""}
						matches={matches}
						loading={loading}
					/>
				</main>
			</div>
		</div>
	);
};

/** `/summoner/$riotId`, where riotId is `GameName-TagLine`. */
export const summonerRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/summoner/$riotId",
	component: SummonerPage,
});
