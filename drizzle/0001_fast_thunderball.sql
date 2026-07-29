CREATE TABLE `auth_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_accounts_provider_account_idx` ON `auth_accounts` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `auth_accounts_user_idx` ON `auth_accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `auth_login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`identity_key` text NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`last_attempt_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_login_attempts_identity_idx` ON `auth_login_attempts` (`identity_key`);--> statement-breakpoint
CREATE TABLE `auth_rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_rate_limits_key_idx` ON `auth_rate_limits` (`key`);--> statement-breakpoint
CREATE TABLE `auth_verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_verifications_identifier_idx` ON `auth_verifications` (`identifier`);--> statement-breakpoint
ALTER TABLE `admin_users` ADD `email_verified` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `admin_users` ADD `image` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_sessions` (`id`, `user_id`, `token`, `expires_at`, `ip_address`, `user_agent`, `revoked_at`, `created_at`, `updated_at`)
SELECT `id`, `user_id`, 'legacy-' || `id`, `expires_at`, `ip_address`, `user_agent`, `revoked_at`, `created_at`, `created_at` FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_idx` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);
