import { createRoute } from "@tanstack/react-router";

import { MatchHistory } from "@/components/matches/match-history";
import { parseRiotIdParam } from "@/components/summoner/summoner.utils";
import { SummonerChampionPool } from "@/components/summoner/summoner-champion-pool";
import { SummonerIdentity } from "@/components/summoner/summoner-identity";
import { SummonerInsights } from "@/components/summoner/summoner-insights";
import { SummonerRankPanel } from "@/components/summoner/summoner-rank-panel";
import { SummonerStatStrip } from "@/components/summoner/summoner-stat-strip";
import { useSummoner } from "@/components/summoner/use-summoner";

import { rootRoute } from "./root-route";

/** A player's profile: current rank, champion form, and recent games. */
const ProfilePage = () => {
	const { riotId } = profileRoute.useParams();
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
			<div className="page-gutter py-32 text-center">
				<p className="font-medium text-ink">{error}</p>
				<p className="mt-2 font-mono text-[11px] text-ink-label">
					{gameName}#{tagLine}
				</p>
			</div>
		);
	}

	// From lg up the page is exactly the viewport minus the 60px header, and the
	// two panes scroll inside it, so the document itself never scrolls and the
	// rail stays put while games are read. Below lg it is one column in normal
	// flow — two stacked scroll areas on a phone would trap the inner one.
	return (
		<div className="page-gutter lg:grid lg:h-[calc(100vh-60px)] lg:grid-rows-[auto_1fr] lg:overflow-hidden">
			{/* Row 2 of the handoff's shell: who this is, and the five figures that
			    answer "how is it going" before anything below is read. Fixed — it
			    describes every game in the pane beneath it, so it must not scroll
			    away from them. */}
			<div className="border-edge border-b lg:grid lg:grid-cols-[minmax(240px,336px)_minmax(0,1fr)] lg:items-stretch">
				<div className="border-edge py-5 lg:border-r lg:pr-7">
					<SummonerIdentity
						// Riot's casing once the account resolves; until then, what was typed.
						gameName={account?.gameName ?? gameName}
						tagLine={account?.tagLine ?? tagLine}
					/>
				</div>
				<SummonerStatStrip
					matches={matches}
					puuid={account?.puuid ?? ""}
					loading={loading}
				/>
			</div>

			{/* Row 3: two panes, each owning its own scrollbar. `min-h-0` on both is
			    what makes that work — without it a grid track sizes to its content
			    and the overflow lands on the document instead. */}
			<div className="lg:grid lg:min-h-0 lg:grid-cols-[minmax(240px,336px)_minmax(0,1fr)] lg:overflow-hidden">
				<aside className="border-edge pb-10 lg:min-h-0 lg:overflow-y-auto lg:border-r lg:pr-7">
					<SummonerRankPanel ranks={ranks} />
					<SummonerChampionPool
						matches={matches}
						puuid={account?.puuid ?? ""}
					/>
					<SummonerInsights />
				</aside>

				<MatchHistory
					puuid={account?.puuid ?? ""}
					matches={matches}
					loading={loading}
					loadingMore={loadingMore}
					retrying={retrying}
					hasMore={hasMore}
					onLoadMore={loadMore}
				/>
			</div>
		</div>
	);
};

/** `/profile/$riotId`, where riotId is `GameName-TagLine`. */
export const profileRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/profile/$riotId",
	component: ProfilePage,
});
