import type { IMatchParticipant } from "@/types/riot/i-match-participant.type";

import { MatchRunes } from "./match-runes";
import { MatchSummonerSpells } from "./match-summoner-spells";
import type { MatchSlotSize } from "./types/match-slot-size.type";

interface IMatchLoadoutProps {
	player: IMatchParticipant;
	size: MatchSlotSize;
}

/**
 * What a player brought into the game: two summoner spells beside a keystone
 * and its secondary tree, as one 2×2 block.
 *
 * Kept together in one component rather than placed by each caller, because the
 * two halves have to stay the same size and share a gap — a scoreboard row that
 * sized its spells and its runes separately would show it immediately.
 */
export const MatchLoadout = (props: IMatchLoadoutProps) => (
	<div className="flex shrink-0 gap-1">
		<MatchSummonerSpells
			spell1={props.player.summoner1Id}
			spell2={props.player.summoner2Id}
			size={props.size}
		/>
		<MatchRunes
			runes={props.player.perks.styles}
			primaryId={props.player.perks.styles[0]?.style ?? 0}
			secondaryId={props.player.perks.styles[1]?.style ?? 0}
			statPerks={props.player.perks.statPerks}
			size={props.size}
		/>
	</div>
);
