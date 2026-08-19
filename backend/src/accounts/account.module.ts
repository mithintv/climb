import { Module } from "@nestjs/common";

import { RiotModule } from "./../riot/riot.module.ts";
import { AccountController } from "./account.controller.ts";
import { AccountRepository } from "./account.repository.ts";
import { AccountService } from "./account.service.ts";

@Module({
	imports: [RiotModule],
	controllers: [AccountController],
	providers: [AccountService, AccountRepository],
	exports: [AccountService],
})
export class AccountModule {}
