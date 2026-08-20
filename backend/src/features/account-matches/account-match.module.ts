import { Module } from "@nestjs/common";

import { RiotModule } from "./../../integrations/riot/riot.module.ts";
import { AccountModule } from "./../accounts/account.module.ts";
import { AccountMatchController } from "./account-match.controller.ts";
import { AccountMatchRepository } from "./account-match.repository.ts";
import { AccountMatchService } from "./account-match.service.ts";

@Module({
	// AccountModule for its repository: the id index hangs off an account row, so
	// a puuid has to be resolved to one before anything can be cached against it.
	imports: [RiotModule, AccountModule],
	controllers: [AccountMatchController],
	providers: [AccountMatchService, AccountMatchRepository],
})
export class AccountMatchModule {}
