import { Module } from "@nestjs/common";

import { RiotModule } from "./../../integrations/riot/riot.module.ts";
import { MatchModule } from "./../matches/match.module.ts";
import { AccountController } from "./account.controller.ts";
import { AccountRepository } from "./account.repository.ts";
import { AccountService } from "./account.service.ts";
import { AccountMatchRepository } from "./account-matches/account-match.repository.ts";
import { AccountMatchService } from "./account-matches/account-match.service.ts";
import { AccountMatchBackfillWorker } from "./account-matches/account-match-backfill.worker.ts";
import { AccountMatchSyncService } from "./account-matches/account-match-sync.service.ts";

@Module({
	// MatchModule for its payload service: a sync saves the payloads as well as
	// the ids, which is what lets every later read come out of the database.
	imports: [RiotModule, MatchModule],
	controllers: [AccountController],
	providers: [
		AccountService,
		AccountRepository,
		// The match index hangs off an account row, so it is wired here rather
		// than in a module of its own: a puuid has to be resolved to an account
		// before anything can be cached against it.
		AccountMatchService,
		AccountMatchSyncService,
		AccountMatchBackfillWorker,
		AccountMatchRepository,
	],
	exports: [AccountService, AccountRepository],
})
export class AccountModule {}
