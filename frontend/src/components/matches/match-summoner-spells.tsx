import summonerSpellLibrary from "@assets/summoner.json";

import { cn } from "@/lib/utils";

import type { MatchSlotSize } from "./types/match-slot-size.type";

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

/** Slot geometry per size step, matching the runes beside them exactly. */
const SPELL_SLOT_CLASS: Record<MatchSlotSize, string> = {
	card: "size-[25px]",
	scoreboard: "size-[15px]",
};

interface ISummonerSpell {
	key: string;
	name: string;
	image: { full: string };
}

interface IMatchSummonerSpellsProps {
	spell1: number;
	spell2: number;
	size: MatchSlotSize;
}

/**
 * The two summoner spells, as the left half of the loadout cluster. Squares,
 * where the runes beside them are circles — see `match-runes.tsx`.
 */
export const MatchSummonerSpells = (props: IMatchSummonerSpellsProps) => {
	// returns summoner spell object given spell ID
	const fetchSpell = (spellId: number) =>
		Object.values<ISummonerSpell>(summonerSpellLibrary.data).find(
			(spell) => parseInt(spell.key, 10) === spellId,
		);

	const spell1 = fetchSpell(props.spell1);
	const spell2 = fetchSpell(props.spell2);

	if (!spell1 || !spell2) return null;

	const slot = cn(
		SPELL_SLOT_CLASS[props.size],
		"border border-control bg-spell-slot",
	);

	return (
		<div className="flex flex-col gap-1">
			<img
				className={slot}
				src={SUMMONER_SPELL_ICONS[spell1.image.full]}
				alt={spell1.name}
				title={spell1.name}
				loading="lazy"
			/>
			<img
				className={slot}
				src={SUMMONER_SPELL_ICONS[spell2.image.full]}
				alt={spell2.name}
				title={spell2.name}
				loading="lazy"
			/>
		</div>
	);
};
