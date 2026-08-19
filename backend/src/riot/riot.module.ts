import { Module } from "@nestjs/common";

import { RiotApiService } from "./riot-api.service.ts";

/** The upstream Riot API client, shared by every feature that calls it. */
@Module({
	providers: [RiotApiService],
	exports: [RiotApiService],
})
export class RiotModule {}
