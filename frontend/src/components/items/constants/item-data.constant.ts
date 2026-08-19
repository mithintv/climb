import itemFile from "@assets/item.json";

import type { IDDragonRawItemFile } from "../types/i-ddragon-raw-item-file.type";

// item.json is 868 entries deep; inferring a literal type per entry costs more
// than it tells us, so the shape is declared once in
// `types/i-ddragon-raw-item-file.type.ts` and asserted here.

/** The bundled Data Dragon asset, typed. Every lookup reads it through this. */
export const ITEM_DATA = itemFile as unknown as IDDragonRawItemFile;
