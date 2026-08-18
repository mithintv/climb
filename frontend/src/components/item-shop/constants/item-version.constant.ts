import itemFile from "@assets/item.json";

/** The Data Dragon patch bundled at `backend/assets/item.json`. */
export const ITEM_VERSION: string = itemFile.version;

/**
 * Patches the page can serve, newest first. Only the bundled asset resolves
 * until items move to the backend, so this is a list of one — the picker is
 * built against the list rather than the constant so adding patches is data.
 */
export const ITEM_VERSIONS: string[] = [ITEM_VERSION];
