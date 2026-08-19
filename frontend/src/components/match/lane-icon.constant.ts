import botIcon from "../../assets/icons/lane-roles/bot.svg?url";
import jungleIcon from "../../assets/icons/lane-roles/jungle.svg?url";
import midIcon from "../../assets/icons/lane-roles/mid.svg?url";
import supportIcon from "../../assets/icons/lane-roles/support.svg?url";
import topIcon from "../../assets/icons/lane-roles/top.svg?url";

/**
 * Role icons for the column between the two team lists, in the order
 * participants are sorted (see POSITION_ORDER in match.tsx).
 */
export const LANE_ICONS = [
	{
		position: "Top",
		url: topIcon,
	},
	{
		position: "Jungle",
		url: jungleIcon,
	},
	{
		position: "Mid",
		url: midIcon,
	},
	{
		position: "Bot",
		url: botIcon,
	},
	{
		position: "Support",
		url: supportIcon,
	},
];
