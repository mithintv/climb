/** A single entry of Data Dragon's `data` map, exactly as the asset ships. */
export interface IDDragonRawItem {
	name: string;
	description: string;
	colloq: string;
	plaintext: string;
	image: { full: string };
	gold: { base: number; total: number; sell: number; purchasable: boolean };
	tags: string[];
	/** Map id → enabled on that map. See `SUMMONERS_RIFT` for the caveat. */
	maps: Record<string, boolean>;
	stats: Record<string, number>;
	/** Ids of the components this item is built from. */
	from?: string[];
	/** Ids of the items this one builds into. */
	into?: string[];
	depth?: number;
	inStore?: boolean;
	hideFromAll?: boolean;
	requiredChampion?: string;
	requiredAlly?: string;
}
