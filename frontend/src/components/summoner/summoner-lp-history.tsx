import { ChartLineIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";

import {
	formatLp,
	formatLpDelta,
	lpChartGeometry,
} from "./summoner-lp-history.utils";

/** Ranked games needed before a queue reports a rank, and so before it charts. */
const PLACEMENT_GAMES = 5;

interface ISummonerLpHistoryProps {
	/** The queue the series belongs to, as the caption states it. */
	queueLabel: string;
	/** LP after each game, oldest first. Empty when the queue has no games. */
	lp: number[];
}

/**
 * The LP trend under the rank block, as a collapsible sparkline.
 *
 * Open by default: it is the one thing on the rail that answers "am I climbing"
 * rather than "where am I", and a reader who does not want it can shut it.
 * Its open state is deliberately independent of the queue toggle above — the
 * panel is a preference about the rail, not about a queue.
 */
export const SummonerLpHistory = (props: ISummonerLpHistoryProps) => {
	const [open, setOpen] = useState(true);
	const geometry = lpChartGeometry(props.lp);
	const Chevron = open ? ChevronUpIcon : ChevronDownIcon;

	return (
		<div className="mt-[18px] border-divider border-t pt-3.5">
			<button
				type="button"
				onClick={() => setOpen((previous) => !previous)}
				aria-expanded={open}
				className="flex w-full items-center justify-between transition-opacity hover:opacity-80"
			>
				<span className="flex items-center gap-2 font-mono text-[10px] text-ink-label tracking-[.2em]">
					<ChartLineIcon className="size-[15px]" aria-hidden={true} />
					LP HISTORY
				</span>
				<Chevron className="size-[18px] text-ink-muted" aria-hidden={true} />
			</button>

			{open && geometry && (
				<div className="mt-3">
					<div className="flex items-baseline justify-between font-mono text-[10px] text-ink-muted">
						<span>
							{props.queueLabel} · {props.lp.length} GAMES
						</span>
						<span className="text-[11px] text-ink">
							{formatLpDelta(props.lp)}
						</span>
					</div>

					{/* Stretched to the rail's width with `preserveAspectRatio="none"`, so
					    the 300-unit box is a coordinate space rather than a shape. The
					    stroke opts out of that scaling — without `non-scaling-stroke` a
					    2px line drawn in a squashed box renders as a wedge. */}
					<div className="mt-2.5 h-[88px]">
						<svg
							viewBox="0 0 300 100"
							preserveAspectRatio="none"
							className="block size-full overflow-visible"
							role="img"
							aria-label={`LP over the last ${props.lp.length} games: ${formatLpDelta(props.lp)}`}
						>
							<line
								x1="0"
								y1="50"
								x2="300"
								y2="50"
								stroke="var(--color-grid-mid)"
								strokeWidth="1"
								vectorEffect="non-scaling-stroke"
							/>
							<line
								x1="0"
								y1="99"
								x2="300"
								y2="99"
								stroke="var(--color-grid-base)"
								strokeWidth="1"
								vectorEffect="non-scaling-stroke"
							/>
							<polyline
								points={geometry.area}
								fill="var(--color-ink-tertiary)"
								fillOpacity="0.08"
								stroke="none"
							/>
							<polyline
								points={geometry.line}
								fill="none"
								stroke="var(--color-ink)"
								strokeWidth="2"
								strokeLinejoin="round"
								strokeLinecap="round"
								vectorEffect="non-scaling-stroke"
							/>
							<circle
								cx={geometry.last.x}
								cy={geometry.last.y}
								r="3"
								fill="var(--color-ink)"
							/>
						</svg>
					</div>

					<div className="mt-2 flex justify-between font-mono text-[9px] text-ink-faint tracking-[.1em]">
						<span>{formatLp(props.lp[0])}</span>
						<span>{formatLp(props.lp[props.lp.length - 1])}</span>
					</div>
				</div>
			)}

			{open && !geometry && (
				// Dashed and the same 88px the chart occupies, so switching queues does
				// not change the rail's height.
				<div className="mt-3.5 grid h-[88px] place-items-center border border-control border-dashed text-center">
					<div>
						<div className="font-mono text-[10px] text-ink-muted tracking-[.12em]">
							NO {props.queueLabel} GAMES
						</div>
						<div className="mt-1.5 text-[12px] text-ink-faint">
							Play {PLACEMENT_GAMES} placements to chart{" "}
							{props.queueLabel.toLowerCase()} LP
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
