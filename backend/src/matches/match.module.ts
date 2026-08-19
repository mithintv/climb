import { Module } from "@nestjs/common";

import { RiotModule } from "./../riot/riot.module.ts";
import { MatchController } from "./match.controller.ts";

@Module({
	imports: [RiotModule],
	controllers: [MatchController],
})
export class MatchModule {}
