CREATE TABLE "account_match_sync" (
	"account_id" integer PRIMARY KEY NOT NULL,
	"head_synced_at" bigint DEFAULT 0 NOT NULL,
	"oldest_game_id" bigint,
	"synced_count" integer DEFAULT 0 NOT NULL,
	"backfill_complete" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"match_id" text NOT NULL,
	"game_id" bigint NOT NULL,
	"platform_id" text NOT NULL,
	"date_created" bigint NOT NULL,
	CONSTRAINT "account_matches_by_match" UNIQUE("account_id","match_id")
);
--> statement-breakpoint
ALTER TABLE "account_match_sync" ADD CONSTRAINT "account_match_sync_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_matches" ADD CONSTRAINT "account_matches_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_matches_by_recency" ON "account_matches" USING btree ("account_id","game_id" DESC);