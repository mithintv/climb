import { Module } from "@nestjs/common";

import { RiotModule } from "./../../integrations/riot/riot.module.ts";
import { AccountController } from "./account.controller.ts";
import { AccountRepository } from "./account.repository.ts";
import { AccountService } from "./account.service.ts";
import { AccountMatchRepository } from "./account-matches/account-match.repository.ts";
import { AccountMatchService } from "./account-matches/account-match.service.ts";

@Module({
	imports: [RiotModule],
	controllers: [AccountController],
	providers: [
		AccountService,
		AccountRepository,
		// The match index hangs off an account row, so it is wired here rather
		// than in a module of its own: a puuid has to be resolved to an account
		// before anything can be cached against it.
		AccountMatchService,
		AccountMatchRepository,
	],
	exports: [AccountService, AccountRepository],
})
export class AccountModule {}
