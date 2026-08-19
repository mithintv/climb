import { Module } from "@nestjs/common";

import { HttpClientService } from "./http-client.service.ts";

/** The shared outbound HTTP client. Any module calling an upstream API imports this. */
@Module({
	providers: [HttpClientService],
	exports: [HttpClientService],
})
export class HttpModule {}
