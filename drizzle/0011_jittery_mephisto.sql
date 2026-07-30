ALTER TABLE `shipping_rules` ADD `blocks_delivery` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `shipping_zones` ADD `neighborhood_names` text;--> statement-breakpoint
ALTER TABLE `shipping_zones` ADD `group_kind` text DEFAULT 'custom' NOT NULL;--> statement-breakpoint
UPDATE `shipping_zones` SET `neighborhood_names` = json_array(`neighborhood`) WHERE `level` = 'neighborhood' AND `neighborhood` IS NOT NULL AND `neighborhood_names` IS NULL;