import type { IMatch } from "@/types/riot/i-match.type";

import { Match, MatchSkeleton } from "./match";

interface MatchListProps {
	puuid: string;
	matches: IMatch[];
	loading: boolean;
}

export const MatchList = (props: MatchListProps) => {
	if (props.loading) {
		return (
			<div className="flex flex-col gap-2">
				{[0, 1, 2, 3, 4].map((placeholder) => (
					<MatchSkeleton key={placeholder} />
				))}
			</div>
		);
	}

	if (props.matches.length === 0) {
		return (
			<p className="rounded-lg border border-gold/25 bg-card/40 card-raised px-4 py-6 text-center text-muted-foreground text-sm">
				No recent matches.
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{props.matches.map((match) => (
				<Match key={match.metadata.matchId} match={match} puuid={props.puuid} />
			))}
		</div>
	);
};
