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
	const {
		account,
		ranks,
		matches,
		loading,
		error,
		loadingMore,
		retrying,
		hasMore,
		loadMore,
	} = useSummoner(gameName, tagLine);

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

	// From lg up the page is exactly the viewport minus the nav (h-14), and the
	// two columns scroll inside it, so the document itself never scrolls and the
	// rail stays put while games are read. Below lg it is one column in normal
	// flow — two stacked scroll areas on a phone would trap the inner one. The
	// 3.5rem matches the nav, and the item shop's frame is built the same way.
	return (
		<div className="mx-auto max-w-6xl px-4 py-6 lg:flex lg:h-[calc(100vh-3.5rem)] lg:flex-col">
			{/* Identity and rank share the rail, so nothing spans the top and the
			    match list starts at the page's first line — the games are what the
			    page is for, and they get its full height. */}
			<div className="grid min-h-0 grid-cols-1 items-start gap-4 lg:items-stretch lg:flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
				<aside className="flex flex-col gap-4 lg:min-h-0 lg:h-full lg:overflow-y-auto lg:pr-1">
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

				<main className="flex flex-col gap-2 lg:h-full lg:min-h-0">
					{/* The heading and the summary stay put; only the games scroll, so
					    what the figures describe is still on screen while reading them. */}
					<h2 className="flex shrink-0 items-center gap-2 px-1 font-semibold text-foreground text-sm">
						<HistoryIcon className="size-3.5 text-gold" aria-hidden="true" />
						Match History
					</h2>

					{account && (
						<div className="shrink-0">
							<SummonerRecentSummary matches={matches} puuid={account.puuid} />
						</div>
					)}

					<div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
						<MatchList
							puuid={account?.puuid ?? ""}
							matches={matches}
							loading={loading}
							loadingMore={loadingMore}
							retrying={retrying}
							hasMore={hasMore}
							onLoadMore={loadMore}
						/>
					</div>
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
