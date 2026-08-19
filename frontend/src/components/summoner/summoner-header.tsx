interface ISummonerHeaderProps {
	gameName: string;
	tagLine: string;
}

/**
 * Who the profile belongs to, as the first card in the rail above the rank
 * cards. The name wraps rather than truncating: a riot id is the one thing on
 * the page that must be readable in full, and the rail is only 300px wide.
 */
export const SummonerHeader = (props: ISummonerHeaderProps) => (
	<header className="rounded-xl border border-white/5 bg-linear-to-br from-indigo-500/15 to-card/40 px-4 py-4">
		<h1 className="font-bold text-foreground text-xl leading-tight tracking-tight">
			{props.gameName}
			<span className="ml-1 font-medium text-base text-muted-foreground">
				#{props.tagLine}
			</span>
		</h1>
	</header>
);
