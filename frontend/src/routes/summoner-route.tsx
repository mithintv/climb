import { createRoute } from "@tanstack/react-router";

import { MatchList } from "@/components/matches/match-list";
import { parseRiotIdParam } from "@/components/summoner/summoner.utils";
import { SummonerChampionStats } from "@/components/summoner/summoner-champion-stats";
import { SummonerHeader } from "@/components/summoner/summoner-header";
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
		<div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8">
			<SummonerHeader
				// Riot's casing once the account resolves; until then, what was typed.
				gameName={account?.gameName ?? gameName}
				tagLine={account?.tagLine ?? tagLine}
				ranks={ranks}
			/>

			{account && matches.length > 0 && (
				<SummonerChampionStats matches={matches} puuid={account.puuid} />
			)}

			<section>
				<h2 className="mb-3 px-1 font-medium text-muted-foreground text-xs uppercase tracking-widest">
					Recent matches
				</h2>
				<MatchList
					puuid={account?.puuid ?? ""}
					matches={matches}
					loading={loading}
				/>
			</section>
		</div>
	);
};

/** `/summoner/$riotId`, where riotId is `GameName-TagLine`. */
export const summonerRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/summoner/$riotId",
	component: SummonerPage,
});
