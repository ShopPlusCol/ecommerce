PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_shipping_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`zone_id` text NOT NULL,
	`fee` integer,
	`free_shipping_threshold` integer,
	`coverage` text,
	`cash_on_delivery_allowed` integer,
	`requires_advance_payment` integer,
	`advance_percentage` integer,
	`same_day_available` integer,
	`same_day_cutoff_hour` integer,
	`estimated_business_days_min` integer,
	`estimated_business_days_max` integer,
	`allowed_payment_methods` text,
	`customer_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`zone_id`) REFERENCES `shipping_zones`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_shipping_rules`("id", "zone_id", "fee", "free_shipping_threshold", "coverage", "cash_on_delivery_allowed", "requires_advance_payment", "advance_percentage", "same_day_available", "same_day_cutoff_hour", "estimated_business_days_min", "estimated_business_days_max", "allowed_payment_methods", "customer_message", "created_at", "updated_at") SELECT "id", "zone_id", "fee", "free_shipping_threshold", "coverage", "cash_on_delivery_allowed", "requires_advance_payment", "advance_percentage", "same_day_available", "same_day_cutoff_hour", "estimated_business_days_min", "estimated_business_days_max", "allowed_payment_methods", "customer_message", "created_at", "updated_at" FROM `shipping_rules`;--> statement-breakpoint
DROP TABLE `shipping_rules`;--> statement-breakpoint
ALTER TABLE `__new_shipping_rules` RENAME TO `shipping_rules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `shipping_rules_zone_id_unique` ON `shipping_rules` (`zone_id`);--> statement-breakpoint
DROP INDEX `shipping_zones_city_idx`;--> statement-breakpoint
ALTER TABLE `shipping_zones` DROP COLUMN `department`;--> statement-breakpoint
ALTER TABLE `shipping_zones` DROP COLUMN `city`;--> statement-breakpoint
ALTER TABLE `shipping_zones` DROP COLUMN `neighborhood`;--> statement-breakpoint
ALTER TABLE `shipping_zones` DROP COLUMN `neighborhood_names`;--> statement-breakpoint
ALTER TABLE `shipping_zones` DROP COLUMN `group_kind`;