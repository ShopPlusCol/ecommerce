CREATE TABLE `inventory_reservations` (
	`id` text PRIMARY KEY NOT NULL,
	`inventory_item_id` text NOT NULL,
	`order_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_method` text DEFAULT 'cash_on_delivery' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `lookup_token_hash` text DEFAULT 'legacy-order-without-public-token' NOT NULL;
