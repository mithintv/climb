import summonerSpellLibrary from "@assets/summoner.json";

interface SummonerSpell {
	key: string;
	name: string;
	image: { full: string };
}

interface SummonerSpellsProps {
	spell1: number;
	spell2: number;
}

export const SummonerSpells = (props: SummonerSpellsProps) => {
	const summonerSpellImage = (spell: SummonerSpell) => {
		return `https://ddragon.leagueoflegends.com/cdn/16.15.1/img/spell/${spell.image.full}`;
	};

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
		<div className="my-px space-y-2">
			<img className="w-5" src={summonerSpellImage(spell1)} alt={spell1.name} />
			<img className="w-5" src={summonerSpellImage(spell2)} alt={spell2.name} />
		</div>
	);
};
