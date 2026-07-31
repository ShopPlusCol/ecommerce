CREATE TABLE `shipping_neighborhood_group_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`city_zone_id` text NOT NULL,
	`group_kind` text NOT NULL,
	`fee` integer,
	`free_shipping_threshold` integer,
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
	FOREIGN KEY (`city_zone_id`) REFERENCES `shipping_zones`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shipping_neighborhood_group_settings_city_kind_idx` ON `shipping_neighborhood_group_settings` (`city_zone_id`,`group_kind`);