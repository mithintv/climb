import summonerSpellLibrary from "@assets/summoner.json";

// Data Dragon's spell art, committed rather than requested off the CDN: its
// image path is versioned, so hotlinking pins every icon to whatever patch the
// URL was written against. The files keep Data Dragon's own names so a spell's
// `image.full` is the lookup key, rather than a second mapping to keep in sync.

/**
 * Spell art by Data Dragon filename, read off the glob's module paths
 * (`.../summoner-spells/SummonerFlash.png` → `SummonerFlash.png`).
 */
const SUMMONER_SPELL_ICONS: Record<string, string> = Object.fromEntries(
	Object.entries(
		import.meta.glob("../../assets/icons/summoner-spells/*.png", {
			eager: true,
			import: "default",
			query: "?url",
		}),
	).map(([path, url]) => [
		path.slice(path.lastIndexOf("/") + 1),
		url as string,
	]),
);

interface SummonerSpell {
	key: string;
	name: string;
	image: { full: string };
}

interface MatchSummonerSpellsProps {
	spell1: number;
	spell2: number;
}

export const MatchSummonerSpells = (props: MatchSummonerSpellsProps) => {
	// returns summoner spell object given spell ID
	const fetchSpell = (spellId: number) => {
		return Object.values<SummonerSpell>(summonerSpellLibrary.data).find(
			(spell) => parseInt(spell.key, 10) === spellId,
		);
	};

	const spell1 = fetchSpell(props.spell1);
	const spell2 = fetchSpell(props.spell2);

	if (!spell1 || !spell2) return null;

	return (
		<div className="flex flex-col gap-0.5">
			<img
				className="size-6 rounded border border-white/10"
				src={SUMMONER_SPELL_ICONS[spell1.image.full]}
				alt={spell1.name}
				loading="lazy"
			/>
			<img
				className="size-6 rounded border border-white/10"
				src={SUMMONER_SPELL_ICONS[spell2.image.full]}
				alt={spell2.name}
				loading="lazy"
			/>
		</div>
	);
};
