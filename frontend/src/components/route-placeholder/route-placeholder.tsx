interface IRoutePlaceholderProps {
	/** What the page will be, in the nav's own words. */
	title: string;
	/** One line on what it will hold, so the page is not a dead end. */
	summary: string;
}

/**
 * A page that exists so its nav link resolves, and says plainly that it is not
 * built yet.
 *
 * The redesign's header names four destinations and two of them have no page
 * behind them. Rendering the links dead would leave the header looking broken;
 * this makes the gap explicit instead, and is the thing to delete when the real
 * page lands.
 */
export const RoutePlaceholder = (props: IRoutePlaceholderProps) => (
	<div className="page-gutter grid place-items-center py-32 text-center">
		<div>
			<h1 className="font-mono text-[10px] text-ink-label tracking-[.2em]">
				{props.title.toUpperCase()}
			</h1>
			<p className="mt-4 font-semibold text-[22px] text-ink tracking-[-.02em]">
				Not built yet
			</p>
			<p className="mt-2 text-[12.5px] text-ink-secondary">{props.summary}</p>
		</div>
	</div>
);
