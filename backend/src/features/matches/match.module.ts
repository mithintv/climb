import { Module } from "@nestjs/common";

import { RiotModule } from "./../../integrations/riot/riot.module.ts";
import { MatchController } from "./match.controller.ts";
import { MatchRepository } from "./match.repository.ts";
import { MatchService } from "./match.service.ts";

@Module({
	imports: [RiotModule],
	controllers: [MatchController],
	providers: [MatchService, MatchRepository],
	exports: [MatchService],
})
export class MatchModule {}
