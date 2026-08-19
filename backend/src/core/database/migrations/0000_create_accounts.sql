CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"puuid" text NOT NULL,
	"game_name" text NOT NULL,
	"tag_line" text NOT NULL,
	"game_name_key" text NOT NULL,
	"tag_line_key" text NOT NULL,
	"region" text NOT NULL,
	"riot_id_checked_at" bigint NOT NULL,
	"date_created" bigint NOT NULL,
	"date_updated" bigint NOT NULL,
	CONSTRAINT "accounts_puuid_unique" UNIQUE("puuid")
);
--> statement-breakpoint
CREATE INDEX "accounts_by_riot_id" ON "accounts" USING btree ("game_name_key","tag_line_key","riot_id_checked_at" DESC);