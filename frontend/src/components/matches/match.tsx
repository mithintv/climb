import {
	ChevronDownIcon,
	ChevronUpIcon,
	CircleCheckIcon,
	CircleXIcon,
} from "lucide-react";
import type { KeyboardEvent } from "react";

import { GoldIcon } from "@/assets/icons/gold-icon";
import { MinionsIcon } from "@/assets/icons/minions-icon";
import { VisionIcon } from "@/assets/icons/vision-icon";
import { cn } from "@/lib/utils";
import type { IMatch } from "@/types/riot/i-match.type";
import type { IMatchParticipant } from "@/types/riot/i-match-participant.type";

import {
	formatGameMode,
	MATCH_QUEUE_NAMES,
} from "./constants/match-queue.constant";
import {
	formatDuration,
	formatGold,
	formatMatchDate,
	formatRelativeTime,
	kdaRatio,
} from "./match.utils";
import { MatchChampion } from "./match-champion";
import { MatchItems } from "./match-items";
import { MatchLoadout } from "./match-loadout";
import { MatchRoster } from "./match-roster";
import { MatchScoreboard } from "./match-scoreboard/match-scoreboard";

/** Summoner's Rift positions, in the order a scoreboard lists them. */
const POSITION_ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

// Sorting rather than looking each position up keeps every participant, even in
// modes like ARAM where `teamPosition` is empty for everyone.
const byPosition = (team: IMatchParticipant[]) =>
	[...team].sort(
		(a, b) =>
			POSITION_ORDER.indexOf(a.teamPosition) -
			POSITION_ORDER.indexOf(b.teamPosition),
	);

/**
 * Holds a card's footprint while the profile is loading. The height tracks the
 * loaded card — a 46px portrait inside 16px of padding, over a divider.
 */
export const MatchSkeleton = () => (
	<div className="h-[78px] animate-pulse border-divider border-b bg-row-hover" />
);

interface IMatchProps {
	match: IMatch;
	/** Whose line in the match to feature. */
	puuid: string;
	/** Whether this card's scoreboard is the one open. */
	open: boolean;
	/** Asks the list to open this card, or to close whatever is open. */
	onToggle: () => void;
}

/**
 * One game: a row that scans in a second, opening into the full scoreboard.
 *
 * The row is a nine-column grid rather than a flex line, so the same figure
 * sits at the same x on every card — a list of games is read down its columns,
 * and a KDA that shifts left because the champion name above it is shorter
 * defeats that entirely.
 */
export const Match = (props: IMatchProps) => {
	const player = props.match.info.participants.find(
		(participant) => participant.puuid === props.puuid,
	);

	// A match the searched player is not in has nothing to feature; the page only
	// ever passes their own games, so this is a guard, not a state.
	if (!player) return null;

	const game = props.match.info;
	const won = player.win;
	const ratio = kdaRatio(player.kills, player.deaths, player.assists);
	const totalCs = player.totalMinionsKilled + player.neutralMinionsKilled;
	const csPerMin =
		game.gameDuration > 0 ? totalCs / (game.gameDuration / 60) : 0;
	const ResultIcon = won ? CircleCheckIcon : CircleXIcon;
	const Chevron = props.open ? ChevronUpIcon : ChevronDownIcon;
	// Riot's queue list is mostly retired rotating modes, so anything the map
	// does not name falls back to the payload's own `gameMode`.
	const queueName =
		MATCH_QUEUE_NAMES[game.queueId] ?? formatGameMode(game.gameMode);

	// Sorted once and handed to both the roster and the scoreboard, so the two
	// cannot disagree about which player is in which lane.
	const team100 = byPosition(
		game.participants.filter((participant) => participant.teamId === 100),
	);
	const team200 = byPosition(
		game.participants.filter((participant) => participant.teamId === 200),
	);

	// The whole row is the target — a 20px chevron is a poor thing to ask
	// somebody to hit twenty times. The chevron stays a real button so the same
	// action is reachable from the keyboard, which a div cannot offer on its own.
	const keyHandler = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== "Enter" && event.key !== " ") return;
		event.preventDefault();
		props.onToggle();
	};

	return (
		<div className="border-divider border-b">
			{/* biome-ignore lint/a11y/useSemanticElements: a <button> cannot contain the rune hover-card trigger, which is itself a button */}
			<div
				role="button"
				tabIndex={0}
				onClick={props.onToggle}
				onKeyDown={keyHandler}
				aria-expanded={props.open}
				// Track sizing, left to right:
				//
				// The result leads, so the first thing read is what queue this was and
				// whether it was won. The art follows at its own fixed widths — 52px for
				// the portrait, 54px for the loadout, being two 25px slots either side
				// of a 4px gap. Those are stated rather than left to `auto` so a track
				// cannot drift from the thing sitting in it.
				//
				// The metrics column barely grows (0.3fr against its neighbours'
				// 0.7-1.8): its three lines are a fixed shape at a fixed size, so
				// anything it took beyond ~124px became empty space between it and the
				// items, reading as padding on the items rather than as slack on the
				// metrics. The width it gives up goes to the roster, which has ten names
				// to fit and actually wants it.
				//
				// The items track's minimum is the block's real width — three 28px
				// slots, two 4px gaps, then the trinket column: 124px. Anything less
				// asked the grid to squeeze art that cannot be squeezed.
				//
				// Every flexible track stays `fr`-sized rather than `auto`: each card is
				// its own grid, so a content-sized track would resolve differently on
				// every card and the columns would stop lining up down the list.
				className="grid cursor-pointer grid-cols-[4px_minmax(116px,0.78fr)_52px_54px_minmax(96px,0.7fr)_minmax(124px,0.3fr)_minmax(124px,0.7fr)_minmax(160px,1.8fr)_20px] items-center gap-3 py-4 transition-colors hover:bg-row-hover"
			>
				{/* The result twice over: a colour rail down the left edge for the scan,
				    and the word itself beside it for anyone the colour does not reach.

				    `self-stretch` overrides the row's `items-center` so the bar fills
				    the content box, and the negative margin takes it most of the way
				    back out over the row's own 16px padding — a grid item stretches to
				    the content box, not the padding box. Most, not all: the 4px left
				    over at each end keeps the bar clear of the dividers above and
				    below, so consecutive wins read as separate games rather than as one
				    continuous green rail down the list. */}
				<div
					className={cn("-my-3 self-stretch", won ? "bg-victory" : "bg-defeat")}
				/>

				<div className="min-w-0">
					<div
						className={cn(
							"flex items-center gap-[7px] font-semibold text-[15px]",
							won ? "text-victory" : "text-defeat",
						)}
					>
						<ResultIcon className="size-4 shrink-0" aria-hidden={true} />
						{won ? "Victory" : "Defeat"}
					</div>
					{/* The queue, not the champion: the portrait sits immediately to the
					    right, so naming the champion here spent the cell's widest line
					    repeating the picture beside it, and which queue a game was in is
					    the one thing about it the row does not otherwise say. Truncated
					    rather than wrapped — a rotating mode with a long name must not
					    make one card taller than the rest of the list. */}
					<div className="mt-[5px] truncate text-center font-mono text-[10px] text-ink-tertiary">
						{queueName} · {formatDuration(game.gameDuration)}
					</div>
					<div className="mt-[3px] whitespace-nowrap font-mono text-[10px] text-ink-faint">
						{formatRelativeTime(game.gameEndTimestamp).toUpperCase()} ·{" "}
						{formatMatchDate(game.gameEndTimestamp)}
					</div>
				</div>

				<div className="relative size-[52px]">
					<MatchChampion
						id={player.championId}
						name={player.championName}
						className="size-[52px] border border-control"
					/>
					<span className="absolute -right-px -bottom-px border border-control bg-surface px-[3px] font-mono text-[9px] text-ink-secondary">
						{player.champLevel}
					</span>
				</div>

				<MatchLoadout player={player} size="card" />

				<div className="text-center">
					<div className="whitespace-nowrap font-mono text-[15px] text-ink">
						{player.kills} / {player.deaths} / {player.assists}
					</div>
					<div className="mt-[5px] font-mono text-[10px] text-ink-muted">
						{ratio === null ? "PERFECT" : `${ratio.toFixed(2)} KDA`}
					</div>
				</div>

				<div className="flex flex-col gap-1 whitespace-nowrap font-mono text-[10.5px] text-ink-tertiary">
					<div className="flex items-center gap-1.5">
						<MinionsIcon
							className="size-[13px] shrink-0 text-cs"
							aria-hidden={true}
						/>
						{totalCs} CS · {csPerMin.toFixed(1)}/m
					</div>
					<div className="flex items-center gap-1.5">
						<GoldIcon
							className="size-[13px] shrink-0 text-gold"
							aria-hidden={true}
						/>
						{formatGold(player.goldEarned)} ·{" "}
						{player.challenges?.goldPerMinute.toFixed(0) ?? "—"}/m
					</div>
					<div className="flex items-center gap-1.5">
						<VisionIcon
							className="size-[13px] shrink-0 text-vision"
							aria-hidden={true}
						/>
						{player.visionScore} VISION
					</div>
				</div>

				<MatchItems
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
					size="card"
				/>

				<MatchRoster
					team100={team100}
					team200={team200}
					searchedPuuid={props.puuid}
				/>

				<button
					type="button"
					onClick={(event) => {
						// The row already handles the click; without this the toggle fires
						// twice and the card closes as fast as it opened.
						event.stopPropagation();
						props.onToggle();
					}}
					aria-expanded={props.open}
					aria-label={props.open ? "Hide scoreboard" : "Show scoreboard"}
					className="justify-self-end text-ink-muted transition-colors hover:text-ink"
				>
					<Chevron className="size-5" aria-hidden={true} />
				</button>
			</div>

			{props.open && (
				<MatchScoreboard
					team100={team100}
					team200={team200}
					searchedPuuid={props.puuid}
					gameDuration={game.gameDuration}
				/>
			)}
		</div>
	);
};
