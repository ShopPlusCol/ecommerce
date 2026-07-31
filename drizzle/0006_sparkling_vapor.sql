CREATE TABLE `request_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`reset_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
