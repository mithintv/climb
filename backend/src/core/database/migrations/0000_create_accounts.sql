CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY NOT NULL,
	`puuid` text NOT NULL,
	`game_name` text NOT NULL,
	`tag_line` text NOT NULL,
	`game_name_key` text NOT NULL,
	`tag_line_key` text NOT NULL,
	`region` text NOT NULL,
	`riot_id_checked_at` integer NOT NULL,
	`date_created` integer NOT NULL,
	`date_updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_puuid_unique` ON `accounts` (`puuid`);--> statement-breakpoint
CREATE INDEX `accounts_by_riot_id` ON `accounts` (`game_name_key`,`tag_line_key`,"riot_id_checked_at" DESC);