import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
	Injectable,
	Logger,
	type OnApplicationBootstrap,
} from "@nestjs/common";

import { PerkRepository } from "./perk.repository.ts";
import type { IDDragonRuneTree } from "./types/i-ddragon-rune-tree.type.ts";

/**
 * Where Data Dragon's rune file is committed. Resolved from this module rather
 * than the working directory, which differs between a package script and the
 * repo root, and reached through `src/` because `dist/` holds no assets.
 */
const RUNES_REFORGED = fileURLToPath(
	new URL("./../../../assets/runesReforged.json", import.meta.url),
);

/**
 * Fills `perks` from the committed Data Dragon asset at boot.
 *
 * It runs every start and is idempotent, so updating the asset is enough to
 * rename a rune — there is no migration to write. `onApplicationBootstrap`
 * rather than `onModuleInit` so it runs after the database module has finished
 * migrating.
 *
 * A failure here is logged and swallowed. The seed only supplies names and
 * icons; ingest creates any perk row it needs on its own, so a match still
 * stores correctly against an unseeded table.
 */
@Injectable()
export class PerkSeedService implements OnApplicationBootstrap {
	private readonly logger = new Logger(PerkSeedService.name);
	private readonly perks: PerkRepository;

	constructor(perks: PerkRepository) {
		this.perks = perks;
	}

	async onApplicationBootstrap() {
		try {
			const trees = JSON.parse(
				readFileSync(RUNES_REFORGED, "utf8"),
			) as IDDragonRuneTree[];
			const { seeded } = await this.perks.seed(trees, Date.now());
			this.logger.log(`Seeded ${seeded} perks`);
		} catch (error) {
			this.logger.error(
				`Could not seed perks; rows will carry ids without names: ${String(error)}`,
			);
		}
	}
}
