ALTER TABLE `shipping_rules` ADD `coverage` text;--> statement-breakpoint
ALTER TABLE `shipping_zones` ADD `parent_zone_id` text REFERENCES shipping_zones(id);--> statement-breakpoint
CREATE INDEX `shipping_zones_parent_idx` ON `shipping_zones` (`parent_zone_id`);