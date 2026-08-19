import runesLibrary from "@assets/runesReforged.json";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/ui/hover-card";

import type { PerkStyle } from "../../types/riot";
import { STAT_SHARDS, statShardImage } from "./stat-shard.constant";

interface Rune {
	id: number;
	icon: string;
	name: string;
}

interface RuneTree {
	id: number;
	name: string;
	icon: string;
}

// Rune icons are the one Data Dragon path that is not versioned.
const runeImage = (rune: { icon: string }) =>
	`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`;

interface RunesProps {
	runes: PerkStyle[];
	primaryId: number;
	secondaryId: number;
	/** The three stat shard ids, in offense/flex/defense order. */
	statPerks: { offense: number; flex: number; defense: number };
}

export const Runes = (props: RunesProps) => {
	// return rune object from static assets given the ID of a given rune tree
	const fetchRuneObject = (runeTreeId: number) => {
		return runesLibrary.find((runeTree) => runeTree.id === runeTreeId);
	};

	// return specific rune slot object from static assets given the string 'primary' or 'secondary' and rune slot number
	const fetchRuneSlot = (tree: "primary" | "secondary", runeSlot: number) => {
		const runeTree = fetchRuneObject(
			tree === "primary" ? props.primaryId : props.secondaryId,
		);
		const j = tree === "primary" ? 0 : 1;
		if (!runeTree) return;
		for (let i = 0; i < 4; i++) {
			const rune = runeTree.slots[i].runes.find(
				(slot) => slot.id === props.runes[j].selections[runeSlot - 1].perk,
			);
			if (rune) return rune;
		}
	};

	// return array of rune slot objects from static assets given the string 'primary' or 'secondary'
	const createRuneArray = (tree: "primary" | "secondary") => {
		const slotNumber = tree === "primary" ? 4 : 2;
		const array: Rune[] = [];
		for (let i = 1; i < slotNumber + 1; i++) {
			const rune = fetchRuneSlot(tree, i);
			if (rune) array.push(rune);
		}
		return array;
	};

	const primaryRunes = createRuneArray("primary");
	const secondaryRunes = createRuneArray("secondary");
	const primaryTree = fetchRuneObject(props.primaryId) as RuneTree | undefined;
	const secondaryTree = fetchRuneObject(props.secondaryId) as
		| RuneTree
		| undefined;

	// The keystone is the first pick of the primary tree, and the only rune the
	// collapsed card shows; everything else lives in the hover panel.
	const keystone = primaryRunes[0];
	if (!keystone || !secondaryTree) return null;

	return (
		<HoverCard openDelay={120} closeDelay={80}>
			<HoverCardTrigger
				// A button so the panel is reachable by keyboard, not hover only.
				type="button"
				// Stacked, not side by side: one icon of width instead of two, and
				// the keystone over its secondary tree reads as one build.
				className="flex cursor-default flex-col items-center gap-0.5 rounded outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
				aria-label={`Runes: ${keystone.name}, ${secondaryTree.name} secondary`}
			>
				<img
					className="size-6 rounded-full bg-black/40"
					src={runeImage(keystone)}
					alt=""
					loading="lazy"
				/>
				<img
					className="size-4 opacity-80"
					src={runeImage(secondaryTree)}
					alt=""
					loading="lazy"
				/>
			</HoverCardTrigger>

			<HoverCardContent align="start" className="w-56">
				<RuneTreeDetail
					treeName={primaryTree?.name ?? "Primary"}
					runes={primaryRunes}
					highlightFirst
				/>
				<div className="my-2 border-white/10 border-t" />
				<RuneTreeDetail treeName={secondaryTree.name} runes={secondaryRunes} />
				<div className="my-2 border-white/10 border-t" />
				<StatShardDetail statPerks={props.statPerks} />
			</HoverCardContent>
		</HoverCard>
	);
};

interface RuneTreeDetailProps {
	treeName: string;
	runes: Rune[];
	/** The primary tree's first rune is the keystone, so it is named larger. */
	highlightFirst?: boolean;
}

const RuneTreeDetail = (props: RuneTreeDetailProps) => (
	<div>
		<p className="mb-1.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
			{props.treeName}
		</p>
		<ul className="flex flex-col gap-1.5">
			{props.runes.map((rune, index) => (
				<li key={rune.id} className="flex items-center gap-2">
					<img
						className="size-5 shrink-0 rounded-full bg-black/40"
						src={runeImage(rune)}
						alt=""
						loading="lazy"
					/>
					<span
						className={
							props.highlightFirst && index === 0
								? "font-semibold text-foreground text-xs"
								: "text-muted-foreground text-xs"
						}
					>
						{rune.name}
					</span>
				</li>
			))}
		</ul>
	</div>
);

interface StatShardDetailProps {
	statPerks: { offense: number; flex: number; defense: number };
}

/**
 * The three shards under the trees. An id of 0 means the row was left empty, so
 * it is skipped rather than rendered as a missing icon.
 */
const StatShardDetail = (props: StatShardDetailProps) => {
	const chosen = [
		props.statPerks.offense,
		props.statPerks.flex,
		props.statPerks.defense,
	]
		.map((id) => STAT_SHARDS[id])
		.filter((shard) => shard !== undefined);

	if (chosen.length === 0) return null;

	return (
		<div>
			<p className="mb-1.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
				Shards
			</p>
			<ul className="flex flex-col gap-1.5">
				{chosen.map((shard) => (
					<li key={shard.icon} className="flex items-center gap-2">
						<img
							className="size-5 shrink-0 rounded-full bg-black/40"
							src={statShardImage(shard)}
							alt=""
							loading="lazy"
						/>
						<span className="text-muted-foreground text-xs">
							<span className="font-semibold text-foreground tabular-nums">
								{shard.value}
							</span>{" "}
							{shard.name}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
};
