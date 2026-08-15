interface ChampionProps {
	name: string;
	id?: number;
}

export const Champion = (props: ChampionProps) => {
	const championImage = (championName: string) => {
		return `https://ddragon.leagueoflegends.com/cdn/16.15.1/img/champion/${championName}.png`;
	};
	return <img src={championImage(props.name)} alt={props.name} />;
};
