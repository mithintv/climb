import { LightbulbIcon, SkullIcon, TrendingDownIcon } from "lucide-react";
import type { ComponentType } from "react";

import { VisionIcon } from "@/assets/icons/vision-icon";

import { SUMMONER_INSIGHTS_PLACEHOLDER } from "./summoner-insights.constant";
import type { SummonerInsightIcon } from "./types/summoner-insight-icon.type";

/**
 * How each subject is drawn. The colours are the semantic set the rest of the
 * page uses, so a line about vision is the same red as every vision figure in
 * the match list rather than a colour invented for this block.
 */
const SUMMONER_INSIGHT_GLYPHS: Record<
	SummonerInsightIcon,
	{ Icon: ComponentType<{ className?: string }>; className: string }
> = {
	deaths: { Icon: SkullIcon, className: "text-defeat" },
	farming: { Icon: TrendingDownIcon, className: "text-gold" },
	vision: { Icon: VisionIcon, className: "text-victory" },
};

/**
 * The bottom of the rail: what the games say could be better.
 *
 * Currently placeholder copy for every account — see the constant for what each
 * line would need before it is true.
 */
export const SummonerInsights = () => (
	<section className="py-5">
		<h2 className="flex items-center gap-2 font-mono text-[10px] text-ink-label tracking-[.2em]">
			<LightbulbIcon className="size-[15px]" aria-hidden={true} />
			WHAT'S HOLDING YOU BACK
		</h2>

		<ul>
			{SUMMONER_INSIGHTS_PLACEHOLDER.map((insight) => {
				const { Icon, className } = SUMMONER_INSIGHT_GLYPHS[insight.icon];
				return (
					<li
						key={insight.text}
						className="flex gap-2.5 border-divider border-b py-3.5"
					>
						<Icon className={`mt-px size-[15px] shrink-0 ${className}`} />
						{/* `text-wrap: pretty` so a three-line note does not end on one
						    orphaned word, which is most of what makes a narrow column of
						    prose look unfinished. */}
						<span className="text-pretty text-[12.5px] text-ink-secondary leading-[1.5]">
							{insight.text}
						</span>
					</li>
				);
			})}
		</ul>
	</section>
);
