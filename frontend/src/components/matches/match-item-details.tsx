import parse from "html-react-parser";

/**
 * Tailwind classes per Data Dragon markup tag. Riot wraps item descriptions in
 * its own tags (`<active>`, `<passive>`, …) which no browser styles, so each is
 * rewritten to a `<span>` carrying these classes. A tag mapped to the empty
 * string is recognised but deliberately unstyled — it still has to be listed,
 * or the tag would survive into the output as unknown markup.
 */
const TAG_CLASSES: Record<string, string> = {
	mainText: "",
	status: "",
	stats: "",
	attention: "",
	active: "font-bold",
	rarityGeneric: "",
	healing: "",
	OnHit: "",
	passive: "",
	scaleLevel: "",
	magicDamage: "",
	rules: "",
	rarityLegendary: "",
	rarityMythic: "",
	speed: "",
	scaleAP: "",
};

interface MatchItemDetailsProps {
	description: string;
}

export const MatchItemDetails = (props: MatchItemDetailsProps) => {
	const regex = (keyword: string) => {
		const re = new RegExp(`(?<=<)(${keyword})(?=>)`, "g");
		return re;
	};
	const parseTags = (item: string) => {
		for (const [keyword, classes] of Object.entries(TAG_CLASSES)) {
			item = item.replace(
				regex(keyword),
				classes ? `span className='${classes}'` : "span",
			);
		}
		return item;
	};

	// opening tags
	const value = props.description;
	const newOpeningTags = parseTags(value);
	// closing tags
	const closingTags = /(?<=\/)(.*?)(?=>)/g;
	const newDescriptionTags = newOpeningTags.replace(closingTags, "span");

	return <div className="">{parse(newDescriptionTags)}</div>;
};
