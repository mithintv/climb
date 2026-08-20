import { BotLaneIcon } from "@/assets/icons/lane-roles/bot-lane-icon";
import { JungleLaneIcon } from "@/assets/icons/lane-roles/jungle-lane-icon";
import { MidLaneIcon } from "@/assets/icons/lane-roles/mid-lane-icon";
import { SupportLaneIcon } from "@/assets/icons/lane-roles/support-lane-icon";
import { TopLaneIcon } from "@/assets/icons/lane-roles/top-lane-icon";

/**
 * Role icons for the column between the two team lists, in the order
 * participants are sorted (see POSITION_ORDER in match.tsx).
 *
 * Components rather than image urls: each one draws in `currentColor`, so the
 * column is coloured by the ink step the roster gives it rather than by the
 * lavender the client's own files are drawn in.
 */
export const MATCH_LANE_ICONS = [
	{
		position: "Top",
		Icon: TopLaneIcon,
	},
	{
		position: "Jungle",
		Icon: JungleLaneIcon,
	},
	{
		position: "Mid",
		Icon: MidLaneIcon,
	},
	{
		position: "Bot",
		Icon: BotLaneIcon,
	},
	{
		position: "Support",
		Icon: SupportLaneIcon,
	},
];
