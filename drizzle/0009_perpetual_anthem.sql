ALTER TABLE `products` ADD `limit_category_id` text REFERENCES categories(id);--> statement-breakpoint
ALTER TABLE `products` ADD `max_units_per_category_unit` integer;