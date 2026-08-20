CREATE TABLE "game_maps" (
	"id" integer PRIMARY KEY NOT NULL,
	"date_created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_modes" (
	"id" serial PRIMARY KEY NOT NULL,
	"mode" text NOT NULL,
	"date_created" bigint NOT NULL,
	CONSTRAINT "game_modes_mode_unique" UNIQUE("mode")
);
--> statement-breakpoint
CREATE TABLE "game_platforms" (
	"id" text PRIMARY KEY NOT NULL,
	"date_created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_queues" (
	"id" integer PRIMARY KEY NOT NULL,
	"date_created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"date_created" bigint NOT NULL,
	CONSTRAINT "game_types_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "match_participant_perks" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_participant_id" integer NOT NULL,
	"kind" text NOT NULL,
	"slot" integer NOT NULL,
	"style_id" integer,
	"perk_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_row_id" integer NOT NULL,
	"participant_index" integer NOT NULL,
	"puuid" text NOT NULL,
	"riot_id_game_name" text,
	"riot_id_tagline" text,
	"team_id" integer,
	"team_position" text,
	"champion_id" integer,
	"champion_name" text,
	"win" boolean,
	"kills" integer,
	"deaths" integer,
	"assists" integer,
	"gold_earned" integer,
	"total_minions_killed" integer,
	"neutral_minions_killed" integer,
	"summoner1_id" integer,
	"summoner2_id" integer,
	"item0" integer,
	"item1" integer,
	"item2" integer,
	"item3" integer,
	"item4" integer,
	"item5" integer,
	"item6" integer,
	"placement" integer
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform_id" text NOT NULL,
	"game_id" bigint NOT NULL,
	"match_id" text GENERATED ALWAYS AS ("matches"."platform_id" || '_' || "matches"."game_id") STORED NOT NULL,
	"data_version" text,
	"queue_id" integer NOT NULL,
	"map_id" integer NOT NULL,
	"game_mode_id" integer NOT NULL,
	"game_type_id" integer NOT NULL,
	"patch_id" integer NOT NULL,
	"game_creation" bigint,
	"game_start_ms" bigint,
	"game_end_ms" bigint,
	"game_duration" integer,
	"end_of_game_result" text,
	"payload" "bytea" NOT NULL,
	"payload_encoding" text NOT NULL,
	"payload_bytes" integer NOT NULL,
	"projection_version" integer NOT NULL,
	"fetched_at" bigint NOT NULL,
	CONSTRAINT "matches_match_id_unique" UNIQUE("match_id")
);
--> statement-breakpoint
CREATE TABLE "patches" (
	"id" serial PRIMARY KEY NOT NULL,
	"major" integer NOT NULL,
	"minor" integer NOT NULL,
	"date_created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perks" (
	"id" integer PRIMARY KEY NOT NULL,
	"key" text,
	"name" text,
	"icon" text,
	"style_id" integer,
	"slot" integer,
	"date_created" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "match_participant_perks" ADD CONSTRAINT "match_participant_perks_match_participant_id_match_participants_id_fk" FOREIGN KEY ("match_participant_id") REFERENCES "public"."match_participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_participant_perks" ADD CONSTRAINT "match_participant_perks_style_id_perks_id_fk" FOREIGN KEY ("style_id") REFERENCES "public"."perks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_participant_perks" ADD CONSTRAINT "match_participant_perks_perk_id_perks_id_fk" FOREIGN KEY ("perk_id") REFERENCES "public"."perks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_match_row_id_matches_id_fk" FOREIGN KEY ("match_row_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_platform_id_game_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."game_platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_queue_id_game_queues_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."game_queues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_map_id_game_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."game_maps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_game_mode_id_game_modes_id_fk" FOREIGN KEY ("game_mode_id") REFERENCES "public"."game_modes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_game_type_id_game_types_id_fk" FOREIGN KEY ("game_type_id") REFERENCES "public"."game_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_patch_id_patches_id_fk" FOREIGN KEY ("patch_id") REFERENCES "public"."patches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "match_participant_perks_by_slot" ON "match_participant_perks" USING btree ("match_participant_id","kind","slot");--> statement-breakpoint
CREATE UNIQUE INDEX "match_participants_by_index" ON "match_participants" USING btree ("match_row_id","participant_index");--> statement-breakpoint
CREATE INDEX "match_participants_by_puuid" ON "match_participants" USING btree ("puuid","match_row_id");--> statement-breakpoint
CREATE UNIQUE INDEX "patches_by_version" ON "patches" USING btree ("major","minor");