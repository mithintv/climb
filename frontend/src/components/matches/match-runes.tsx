import runesLibrary from "@assets/runesReforged.json";

import { cn } from "@/lib/utils";
import type { IPerkStyle } from "@/types/riot/i-perk-style.type";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/ui/hover-card";

import { MATCH_RUNE_STAT_SHARDS } from "./constants/match-rune-stat-shard.constant";
import {
	type IRune,
	type IRuneTreeLibraryEntry,
	resolveMatchRunes,
	runeIconUrl,
} from "./match-runes.utils";
import type { MatchSlotSize } from "./types/match-slot-size.type";

/** Slot geometry per size step, matching the spells beside them exactly. */
const RUNE_SLOT_CLASS: Record<MatchSlotSize, string> = {
	card: "size-[25px]",
	scoreboard: "size-[15px]",
};

interface IMatchRunesProps {
	runes: IPerkStyle[];
	primaryId: number;
	secondaryId: number;
	/** The three stat shard ids, in offense/flex/defense order. */
	statPerks: { offense: number; flex: number; defense: number };
	size: MatchSlotSize;
}

/**
 * The keystone over the secondary tree, as the right half of the loadout
 * cluster, with the full page on hover.
 *
 * Circles, where the summoner spells beside them are squares: the two are the
 * same size and sit in the same 2×2 block, so shape is the only thing telling a
 * reader which is which at 22px.
 */
export const MatchRunes = (props: IMatchRunesProps) => {
	const { keystone, primaryTree, secondaryTree, primaryRunes, secondaryRunes } =
		resolveMatchRunes(
			props.runes,
			props.primaryId,
			props.secondaryId,
			runesLibrary as IRuneTreeLibraryEntry[],
		);

	// Arena and some rotating modes return a perks block with no picks in it.
	// The card still renders — it just has no rune column.
	if (!keystone || !secondaryTree) return null;

	const slot = RUNE_SLOT_CLASS[props.size];

	return (
		<HoverCard openDelay={120} closeDelay={80}>
			<HoverCardTrigger
				// A button so the panel is reachable by keyboard, not hover only.
				type="button"
				className="flex cursor-default flex-col gap-1 rounded outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
				aria-label={`Runes: ${keystone.name}, ${secondaryTree.name} secondary`}
			>
				{/* The keystone is the one rune worth naming at this size, so it gets
				    the gold frame the page reserves for a game's headline pick. */}
				<img
					className={cn(
						slot,
						"rounded-full border border-quest-edge bg-quest-slot",
					)}
					src={runeIconUrl(keystone.key)}
					alt=""
					loading="lazy"
				/>
				<img
					className={cn(slot, "rounded-full border border-control bg-slot")}
					src={runeIconUrl(secondaryTree.key)}
					alt=""
					loading="lazy"
				/>
			</HoverCardTrigger>

			<HoverCardContent align="start" className="w-56">
				<MatchRuneTreeDetail
					treeName={primaryTree?.name ?? "Primary"}
					runes={primaryRunes}
					highlightFirst
				/>
				<div className="my-2 border-edge border-t" />
				<MatchRuneTreeDetail
					treeName={secondaryTree.name}
					runes={secondaryRunes}
				/>
				<div className="my-2 border-edge border-t" />
				<MatchStatShardDetail statPerks={props.statPerks} />
			</HoverCardContent>
		</HoverCard>
	);
};

interface IMatchRuneTreeDetailProps {
	treeName: string;
	runes: IRune[];
	/** The primary tree's first rune is the keystone, so it is named larger. */
	highlightFirst?: boolean;
}

const MatchRuneTreeDetail = (props: IMatchRuneTreeDetailProps) => (
	<div>
		<p className="mb-1.5 font-mono text-[9px] text-ink-label tracking-[.18em]">
			{props.treeName.toUpperCase()}
		</p>
		<ul className="flex flex-col gap-1.5">
			{props.runes.map((rune, index) => (
				<li key={rune.id} className="flex items-center gap-2">
					<img
						className="size-5 shrink-0 rounded-full bg-slot"
						src={runeIconUrl(rune.key)}
						alt=""
						loading="lazy"
					/>
					<span
						className={
							props.highlightFirst && index === 0
								? "font-semibold text-[12px] text-ink"
								: "text-[12px] text-ink-tertiary"
						}
					>
						{rune.name}
					</span>
				</li>
			))}
		</ul>
	</div>
);

interface IMatchStatShardDetailProps {
	statPerks: { offense: number; flex: number; defense: number };
}

/**
 * The three shards under the trees. An id of 0 means the row was left empty, so
 * it is skipped rather than rendered as a missing icon.
 */
const MatchStatShardDetail = (props: IMatchStatShardDetailProps) => {
	const chosen = [
		props.statPerks.offense,
		props.statPerks.flex,
		props.statPerks.defense,
	]
		.map((id) => MATCH_RUNE_STAT_SHARDS[id])
		.filter((shard) => shard !== undefined);

	if (chosen.length === 0) return null;

	return (
		<div>
			<p className="mb-1.5 font-mono text-[9px] text-ink-label tracking-[.18em]">
				SHARDS
			</p>
			<ul className="flex flex-col gap-1.5">
				{chosen.map((shard) => (
					<li key={shard.icon} className="flex items-center gap-2">
						<img
							className="size-5 shrink-0 rounded-full bg-slot"
							src={shard.icon}
							alt=""
							loading="lazy"
						/>
						<span className="text-[12px] text-ink-tertiary">
							<span className="font-mono font-semibold text-ink">
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
