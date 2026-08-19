import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { GoldIcon } from "@/assets/icons/gold-icon";
import { MinionsIcon } from "@/assets/icons/minions-icon";
import { VisionIcon } from "@/assets/icons/vision-icon";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Label } from "@/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/ui/select";
import { Textarea } from "@/ui/textarea";

import type {
	MatchDto,
	MatchNotes,
	MatchParticipant,
	MatchState,
} from "../types/riot";
import { Champion } from "./match/champion";
import { Items } from "./match/items";
import {
	formatDuration,
	formatGold,
	formatRelativeTime,
	kdaRatio,
} from "./match/match.utils";
import { formatGameMode, QUEUE_NAMES } from "./match/queue.constant";
import { Runes } from "./match/runes";
import { SummonerSpells } from "./match/summoner-spells";
import { Teams } from "./match/teams";

const POSITION_ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

// Sorting rather than looking each position up keeps every participant, even in
// modes like ARAM where `teamPosition` is empty for everyone.
const byPosition = (team: MatchParticipant[]) =>
	[...team].sort(
		(a, b) =>
			POSITION_ORDER.indexOf(a.teamPosition) -
			POSITION_ORDER.indexOf(b.teamPosition),
	);

/**
 * Splits a match payload into the searched player's line and the two teams.
 * Pure, because the page owns the fetching now — a card renders whatever it is
 * handed, so the champion stats can aggregate the same payloads.
 */
const toMatchState = (
	match: MatchDto,
	puuid: string,
	notes: MatchNotes | null,
): MatchState => {
	const player = match.info.participants.find(
		(participant) => participant.puuid === puuid,
	);

	const empty: MatchState = {
		data: false,
		player: null,
		game: null,
		team100: [],
		team200: [],
		notes,
	};
	if (!player) return empty;

	return {
		data: true,
		player,
		game: {
			gameCreation: match.info.gameCreation,
			gameDuration: match.info.gameDuration,
			gameStartTimestamp: match.info.gameStartTimestamp,
			gameEndTimestamp: match.info.gameEndTimestamp,
			gameId: match.info.gameId,
			gameMode: match.info.gameMode,
			gameVersion: match.info.gameVersion,
			mapId: match.info.mapId,
			queueId: match.info.queueId,
		},
		team100: byPosition(
			match.info.participants.filter(
				(participant) => participant.teamId === 100,
			),
		),
		team200: byPosition(
			match.info.participants.filter(
				(participant) => participant.teamId === 200,
			),
		),
		notes,
	};
};

/**
 * One figure in the stat block: the value with its rate or unit underneath.
 * Two of these stacked make a column, which is roughly half the width the same
 * figures took as separate side-by-side blocks.
 */
const StatCell = (props: {
	value: React.ReactNode;
	sub: string;
	/** The game's scoreboard glyph, naming the figure without spending a word. */
	icon?: React.ReactNode;
	/** Spells out what the icon means, since the glyph carries the label. */
	title?: string;
}) => (
	<div
		className="flex flex-col items-center text-center leading-tight"
		title={props.title}
	>
		<span className="flex items-center gap-1 font-semibold text-foreground text-xs tabular-nums">
			{props.value}
			{props.icon}
		</span>
		<span className="text-[9px] text-muted-foreground tabular-nums">
			{props.sub}
		</span>
	</div>
);

/**
 * Holds a card's footprint while the profile is loading. The height tracks the
 * loaded card — five team rows plus padding — so the list does not jump.
 */
export const MatchSkeleton = () => (
	<div className="h-[102px] animate-pulse rounded-xl border border-white/5 bg-card/40" />
);

interface MatchProps {
	match: MatchDto;
	/** Whose line in the match to feature. */
	puuid: string;
}

export const Match = (props: MatchProps) => {
	const [showNotes, setNotes] = useState(false);
	const matchData = toMatchState(props.match, props.puuid, null);

	const clickHandler = () => {
		setNotes((prevState) => !prevState);
	};

	// A match the searched player is not in has nothing to feature; the page
	// only ever passes their own games, so this is a guard, not a state.
	if (!matchData.data) return null;

	const { player, game } = matchData;
	const won = player.win;
	const ratio = kdaRatio(player.kills, player.deaths, player.assists);
	const totalCs = player.totalMinionsKilled + player.neutralMinionsKilled;
	const csPerMin = totalCs / (game.gameDuration / 60);
	const queueName = QUEUE_NAMES[game.queueId] ?? formatGameMode(game.gameMode);

	return (
		<div
			className={cn(
				"overflow-hidden rounded-xl border transition-colors",
				// The result is carried by a tinted surface and an accent rail, but
				// never by colour alone — the word Victory/Defeat is always present.
				won
					? "border-cyan-400/25 bg-cyan-500/6 hover:border-cyan-400/45"
					: "border-rose-400/25 bg-rose-500/6 hover:border-rose-400/45",
			)}
		>
			<div className="flex items-stretch">
				<div
					className={cn("w-1 shrink-0", won ? "bg-cyan-400" : "bg-rose-400")}
				/>

				{/* One row, no wrapping: the team block is already five rows tall and
				    sets the card's height, so anything that wraps under it is free
				    vertical space wasted. */}
				<div className="flex flex-1 items-center gap-3 px-3 py-1.5">
					<div className="w-24 shrink-0">
						<p className="truncate font-medium text-[11px] text-muted-foreground leading-tight">
							{queueName}
						</p>
						<p
							className={cn(
								"font-bold text-sm leading-tight",
								won ? "text-cyan-300" : "text-rose-300",
							)}
						>
							{won ? "Victory" : "Defeat"}
						</p>
						<p className="text-[10px] text-muted-foreground tabular-nums leading-tight">
							{formatDuration(game.gameDuration)} ·{" "}
							{formatRelativeTime(game.gameEndTimestamp)}
						</p>
					</div>

					<div className="flex shrink-0 items-center gap-1.5">
						<div className="relative">
							<Champion
								id={player.championId}
								name={player.championName}
								className="size-12 rounded-lg border border-white/10"
							/>
							<span className="absolute -right-1 -bottom-1 rounded-full bg-background px-1 font-semibold text-[9px] text-foreground tabular-nums ring-1 ring-white/15">
								{player.champLevel}
							</span>
						</div>
						<SummonerSpells
							spell1={player.summoner1Id}
							spell2={player.summoner2Id}
						/>
						<Runes
							runes={player.perks.styles}
							primaryId={player.perks.styles[0].style}
							secondaryId={player.perks.styles[1].style}
							statPerks={player.perks.statPerks}
						/>
					</div>

					{/* Two stacked columns rather than four blocks in a row: the same
					    figures in about half the width, each value sitting over its own
					    rate. */}
					<div className="flex shrink-0 items-center gap-3">
						<div className="flex w-20 flex-col gap-1">
							<StatCell
								value={
									<>
										{player.kills}
										<span className="mx-0.5 text-muted-foreground">/</span>
										<span className="text-rose-300">{player.deaths}</span>
										<span className="mx-0.5 text-muted-foreground">/</span>
										{player.assists}
									</>
								}
								sub={ratio === null ? "Perfect KDA" : `${ratio.toFixed(2)} KDA`}
							/>
							<StatCell
								value={player.visionScore}
								sub="vision"
								icon={<VisionIcon className="size-3 text-muted-foreground" />}
								title="Vision score"
							/>
						</div>
						<div className="flex w-16 flex-col gap-1">
							<StatCell
								value={totalCs}
								sub={`${csPerMin.toFixed(1)} /min`}
								icon={<MinionsIcon className="size-3 text-muted-foreground" />}
								title="Minions and monsters killed"
							/>
							<StatCell
								value={formatGold(player.goldEarned)}
								sub={`${player.challenges.goldPerMinute.toFixed(0)} /min`}
								icon={<GoldIcon className="size-3 text-muted-foreground" />}
								title="Gold earned"
							/>
						</div>
					</div>

					<Items
						items={[
							player.item0,
							player.item1,
							player.item2,
							player.item3,
							player.item4,
							player.item5,
							player.item6,
						]}
						questReward={player.roleBoundItem}
					/>

					{/* Dropped first when the row runs out of width — the stats above
					    matter more on a narrow screen than the other nine players. The
					    narrower stat block moved this from lg to md. */}
					<div className="ml-auto hidden shrink-0 md:block">
						<Teams match={matchData} />
					</div>
				</div>

				<button
					type="button"
					onClick={clickHandler}
					aria-expanded={showNotes}
					aria-label={showNotes ? "Hide notes" : "Show notes"}
					className={cn(
						"flex w-8 shrink-0 items-center justify-center border-white/5 border-l transition-colors",
						won ? "hover:bg-cyan-400/15" : "hover:bg-rose-400/15",
					)}
				>
					<ChevronDown
						className={cn(
							"size-4 text-muted-foreground transition-transform duration-200",
							showNotes && "rotate-180",
						)}
					/>
				</button>
			</div>

			{showNotes && (
				<div className="border-white/5 border-t bg-background/40 p-4">
					<div className="flex flex-row text-center">
						<div className="w-1/4">
							<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Champion Knowledge
							</p>
							<ul className="mt-1 text-sm">
								{matchData.notes
									? matchData.notes.champion_knowledge.map((note, index) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: notes are read-only today; key on a note id once they come from the backend
											<li key={index}>{note}</li>
										))
									: "..."}
							</ul>
						</div>
						<div className="w-1/4">
							<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Laning
							</p>
						</div>
						<div className="w-1/4">
							<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Teamfighting
							</p>
						</div>
						<div className="w-1/4">
							<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Macro
							</p>
						</div>
					</div>
					<form className="m-auto mt-4 flex flex-col items-center">
						<div className="flex flex-row items-center justify-center py-2">
							<Label className="w-20 px-2" htmlFor="tags">
								Category
							</Label>
							<Select name="tags" defaultValue="Champion Knowledge">
								<SelectTrigger id="tags" className="w-64">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Champion Knowledge">
										Champion Knowledge
									</SelectItem>
									<SelectItem value="Laning">Laning</SelectItem>
									<SelectItem value="Team Fighting">Team Fighting</SelectItem>
									<SelectItem value="Macro">Macro</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-row justify-center py-2">
							<Label className="w-20 px-2 pt-2" htmlFor="note">
								Note
							</Label>
							<Textarea className="h-20 w-64" name="note" id="note" />
						</div>
						<Button type="button">Add Note</Button>
					</form>
				</div>
			)}
		</div>
	);
};
