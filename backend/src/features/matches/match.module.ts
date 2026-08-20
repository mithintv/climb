import { Module } from "@nestjs/common";

import { RiotModule } from "./../../integrations/riot/riot.module.ts";
import { MatchController } from "./match.controller.ts";
import { MatchRepository } from "./match.repository.ts";
import { MatchService } from "./match.service.ts";
import { PerkRepository } from "./perk.repository.ts";
import { PerkSeedService } from "./perk-seed.service.ts";

@Module({
	imports: [RiotModule],
	controllers: [MatchController],
	providers: [MatchService, MatchRepository, PerkRepository, PerkSeedService],
	exports: [MatchService],
})
export class MatchModule {}
