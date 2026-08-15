const itemImage = (item: number) => {
	return `https://ddragon.leagueoflegends.com/cdn/16.15.1/img/item/${item}.png`;
};

const fillerImage = () => {
	return `https://ddragon.leagueoflegends.com/cdn/16.15.1/img/item/7050.png`;
};

interface ItemsProps {
	items: number[];
}

export const Items = (props: ItemsProps) => {
	return (
		// Item names live in backend/assets/item.json, which is too large to pull
		// into the bundle for alt text alone, so the list is labelled as a whole and
		// the icons are marked decorative until the assets move to the backend.
		<ul className="m-auto flex flex-row space-x-1 pt-2" aria-label="Items">
			{props.items.map((item, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: inventory slots are positional
				<li key={index} className="p-0">
					<img
						src={item === 0 ? fillerImage() : itemImage(item)}
						width="30px"
						alt=""
					/>
				</li>
			))}
		</ul>
	);
};
