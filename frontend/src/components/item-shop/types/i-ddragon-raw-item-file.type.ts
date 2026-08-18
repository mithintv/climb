import type { IDDragonRawItem } from "./i-ddragon-raw-item.type";

/**
 * The bundled Data Dragon `item.json` asset. `tree` is the client's tag
 * taxonomy, which the page does not read — the stat rail is its own list.
 */
export interface IDDragonRawItemFile {
	version: string;
	data: Record<string, IDDragonRawItem>;
	tree: { header: string; tags: string[] }[];
}
