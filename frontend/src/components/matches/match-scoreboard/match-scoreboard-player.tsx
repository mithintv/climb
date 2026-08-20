import { csPerMinute } from "@/lib/cs-per-minute";
import { cn } from "@/lib/utils";
import type { IMatchParticipant } from "@/types/riot/i-match-participant.type";

import { formatGold, kdaRatio } from "../match.utils";
import { MatchChampion } from "../match-champion";
import { MatchItems } from "../match-items";
import { MatchLoadout } from "../match-loadout";
import { totalCreepScore } from "./match-scoreboard.utils";

interface IMatchScoreboardPlayerProps {
	player: IMatchParticipant;
	/** Picks the searched player's row out of the ten. */
	isSearchedPlayer: boolean;
	/** Seconds. Riot reports it on the match, so the rates need it passed in. */
	gameDuration: number;
}

/**
 * One of the ten rows in the expanded scoreboard: who, what they brought, how
 * they did, and what they finished with.
 *
 * Every cell is `nowrap`. Two of these grids sit side by side in a pane that
 * can be as narrow as 880px, and a single wrapped figure would make one row
 * taller than its opposite number and put the two teams permanently out of
 * step.
 */
export const MatchScoreboardPlayer = (props: IMatchScoreboardPlayerProps) => {
	const { player } = props;
	// Riot returns "" for summonerName on every participant now.
	const name = player.riotIdGameName || player.championName;
	const ratio = kdaRatio(player.kills, player.deaths, player.assists);

	return (
		// Six columns: portrait, loadout, identity, K/D/A, rates, inventory.
		//
		// Only the identity track flexes, and it is where the row's spare width
		// collects — every other column it could collect in would open a gap
		// between two figures meant to be read together. Everything after it is
		// packed a single gap apart.
		//
		// The rest are fixed widths. The first two are the art's own — 34px for the
		// portrait, and 34px for the loadout as two 15px slots either side of a 4px
		// gap. The figure columns are pinned for a subtler reason: each row is its
		// own grid, so an `auto` track would be one width for "213 CS · 8.8/m" and
		// another for "78 CS · 5.1/m", and nothing would line up down the team.
		<li className="grid grid-cols-[34px_34px_minmax(0,1fr)_66px_92px_auto] items-center gap-2.5 whitespace-nowrap border-divider-subtle border-b py-[9px]">
			{/* Levelled the same way the collapsed card levels its portrait, so the
			    badge means the same thing in both places. Smaller type and tighter
			    padding than the card's, because the tile it hangs off is two thirds
			    the size and the badge would otherwise cover the art. */}
			<div className="relative size-[34px]">
				<MatchChampion
					name={player.championName}
					className="size-[34px] border border-control"
				/>
				<span className="absolute -right-px -bottom-px border border-control bg-surface px-px font-mono text-[8px] text-ink-secondary leading-tight">
					{player.champLevel}
				</span>
			</div>

			<MatchLoadout player={player} size="scoreboard" />

			{/* Capped rather than left to the column: riot ids run to 16 characters
			    and a long one would push every figure in the row out to meet it, so
			    it truncates and keeps its full text in the tooltip. */}
			<div
				className={cn(
					"max-w-[120px] truncate text-[12.5px]",
					props.isSearchedPlayer
						? "font-semibold text-ink"
						: "text-ink-tertiary",
				)}
				title={name}
			>
				{name}
			</div>

			{/* The line, then what it comes to — the same pairing the collapsed card
			    makes, so a ratio here is read against the same thing. A deathless
			    game says so rather than dividing by zero. */}
			<div className="text-center font-mono">
				<div className="text-[10.5px] text-ink-secondary">
					{player.kills} / {player.deaths} / {player.assists}
				</div>
				<div className="mt-px text-[9.5px] text-ink-muted">
					{ratio === null ? "PERFECT" : `${ratio.toFixed(2)} KDA`}
				</div>
			</div>

			{/* Coloured by what each figure measures, not by how good it is — the
			    same three colours the collapsed card's metrics column uses, so a
			    reader who has learned them once does not relearn them here. Totals
			    carry their rate, because a 30-minute game and a 45-minute one are
			    not comparable on the total alone. */}
			<div className="flex flex-col gap-0.5 text-right font-mono text-[9.5px]">
				<span className="text-cs">
					{totalCreepScore(player)} CS ·{" "}
					{csPerMinute(totalCreepScore(player), props.gameDuration).toFixed(1)}
					/m
				</span>
				<span className="text-gold">
					{formatGold(player.goldEarned)} ·{" "}
					{player.challenges?.goldPerMinute.toFixed(0) ?? "—"}/m
				</span>
				<span className="text-vision">{player.visionScore} VIS</span>
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
				size="scoreboard"
			/>
		</li>
	);
};
