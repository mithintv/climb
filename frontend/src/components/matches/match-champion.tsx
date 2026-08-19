import { cn } from "@/lib/utils";

interface MatchChampionProps {
	name: string;
	id?: number;
	className?: string;
}

export const MatchChampion = (props: MatchChampionProps) => {
	const championImage = (championName: string) => {
		return `https://ddragon.leagueoflegends.com/cdn/16.15.1/img/champion/${championName}.png`;
	};
	return (
		<img
			src={championImage(props.name)}
			alt={props.name}
			loading="lazy"
			className={cn("object-cover", props.className)}
		/>
	);
};
