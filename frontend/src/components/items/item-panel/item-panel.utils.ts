/**
 * Cut a description in two at its first `<active>`, returning the part before
 * it and the active itself. Both halves are re-wrapped in `<mainText>` so the
 * existing parser sees the tag nesting it expects; an item with no active comes
 * back unchanged with an empty second half.
 */
export const splitActive = (description: string): [string, string] => {
	const at = description.indexOf("<active>");
	if (at === -1) return [description, ""];
	const body = `${description.slice(0, at)}</mainText>`;
	// Data Dragon is inconsistent about labelling the active: some name it
	// ("Time Stop"), some just say "Active", some prefix the name ("Active -
	// Consume:"). The heading above the block says it once, so a leading
	// "Active" and its separator come off, and a span left empty is dropped.
	const active = `<mainText>${description.slice(at)}`.replace(
		/<active>Active\s*[-–—:]?\s*(.*?)<\/active>/i,
		(_, name: string) => (name ? `<active>${name}</active>` : ""),
	);
	// Trailing `<br>`s belong to the gap the split replaces.
	return [body.replace(/(<br>\s*)+<\/mainText>$/, "</mainText>"), active];
};
