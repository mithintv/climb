/** The chart's coordinate space, which the SVG declares as its `viewBox`. */
const CHART_WIDTH = 300;
const CHART_HEIGHT = 100;

/**
 * The band the line is allowed to occupy inside that space. It stops short of
 * both edges so the 2px stroke and the 3px end dot are not clipped in half by
 * the viewBox — the SVG is stretched with `preserveAspectRatio="none"`, so
 * there is no aspect-ratio slack to absorb them.
 */
const PLOT_TOP = 10;
const PLOT_BOTTOM = 94;

/** The polylines and end point one LP series draws. */
export interface ILpChartGeometry {
	/** `"x,y x,y …"` for the line itself. */
	line: string;
	/** The same points closed down to the baseline, for the fill under the line. */
	area: string;
	/** The latest reading, which gets a dot so "where am I now" is findable. */
	last: { x: number; y: number };
}

/**
 * Projects an LP series into the chart's box.
 *
 * Normalised to its own min and max rather than to an absolute LP scale: a
 * climb from 1,247 to 1,359 and one from 12 to 124 are the same shape, and the
 * axis labels underneath carry the actual numbers. A flat series has no span to
 * divide by, so it is drawn along the middle instead of dividing by zero.
 */
export const lpChartGeometry = (lp: number[]): ILpChartGeometry | null => {
	if (lp.length === 0) return null;

	const min = Math.min(...lp);
	const max = Math.max(...lp);
	const span = max - min;
	const plotHeight = PLOT_BOTTOM - PLOT_TOP;

	const points = lp.map((value, index) => {
		// A single reading has no interval to spread across, so it sits at the end
		// of the axis where the newest point always is.
		const x =
			lp.length === 1 ? CHART_WIDTH : (index / (lp.length - 1)) * CHART_WIDTH;
		const y =
			span === 0
				? PLOT_TOP + plotHeight / 2
				: PLOT_BOTTOM - ((value - min) / span) * plotHeight;
		return {
			x: Math.round(x * 10) / 10,
			y: Math.round(y * 10) / 10,
		};
	});

	const line = points.map((point) => `${point.x},${point.y}`).join(" ");

	return {
		line,
		// Closed along the bottom edge of the viewBox, not the plot band, so the
		// fill reaches the baseline rule rather than floating above it.
		area: `0,${CHART_HEIGHT} ${line} ${CHART_WIDTH},${CHART_HEIGHT}`,
		last: points[points.length - 1],
	};
};

/** `1247` → `"1,247 LP"`, which is how the axis labels read. */
export const formatLp = (lp: number) => `${lp.toLocaleString("en-US")} LP`;

/**
 * The net change across a series, signed. `+112 LP` and `-40 LP` both need
 * their sign — an unsigned delta on a chart that goes both ways is unreadable.
 */
export const formatLpDelta = (lp: number[]) => {
	if (lp.length < 2) return "±0 LP";
	const delta = lp[lp.length - 1] - lp[0];
	const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
	return `${sign}${Math.abs(delta).toLocaleString("en-US")} LP`;
};
