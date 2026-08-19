import { Module } from "@nestjs/common";

import { HttpModule } from "./../../core/http/http.module.ts";
import { RiotApiService } from "./riot-api.service.ts";

/** The upstream Riot API client, shared by every feature that calls it. */
@Module({
	imports: [HttpModule],
	providers: [RiotApiService],
	exports: [RiotApiService],
})
export class RiotModule {}
