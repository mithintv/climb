import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "url";

const dbPath = fileURLToPath(new URL("../climb.db", import.meta.url));
const db = new DatabaseSync(dbPath);

export { db };
