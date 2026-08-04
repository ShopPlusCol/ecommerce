PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`customer_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`payment_method` text NOT NULL,
	`delivery_method` text NOT NULL,
	`lookup_token_hash` text NOT NULL,
	`customer_full_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_email` text,
	`shipping_department` text,
	`shipping_city` text,
	`shipping_neighborhood` text,
	`shipping_address_line` text,
	`shipping_address_complement` text,
	`delivery_instructions` text,
	`shipping_rule_id_snapshot` text,
	`shipping_rule_level_snapshot` text,
	`subtotal` integer NOT NULL,
	`discount_total` integer DEFAULT 0 NOT NULL,
	`shipping_fee` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`amount_due_now` integer NOT NULL,
	`amount_paid` integer DEFAULT 0 NOT NULL,
	`amount_due_on_delivery` integer DEFAULT 0 NOT NULL,
	`coupon_code` text,
	`applied_promotions` text,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`utm_content` text,
	`utm_term` text,
	`utm_first_attribution` text,
	`utm_last_attribution` text,
	`terms_version_accepted` text,
	`marketing_consent` integer,
	`internal_notes` text,
	`cancelled_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "order_number", "customer_id", "status", "payment_status", "payment_method", "delivery_method", "lookup_token_hash", "customer_full_name", "customer_phone", "customer_email", "shipping_department", "shipping_city", "shipping_neighborhood", "shipping_address_line", "shipping_address_complement", "delivery_instructions", "shipping_rule_id_snapshot", "shipping_rule_level_snapshot", "subtotal", "discount_total", "shipping_fee", "total", "amount_due_now", "amount_paid", "amount_due_on_delivery", "coupon_code", "applied_promotions", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_first_attribution", "utm_last_attribution", "terms_version_accepted", "marketing_consent", "internal_notes", "cancelled_reason", "created_at", "updated_at") SELECT "id", "order_number", "customer_id", "status", "payment_status", "payment_method", "delivery_method", "lookup_token_hash", "customer_full_name", "customer_phone", "customer_email", "shipping_department", "shipping_city", "shipping_neighborhood", "shipping_address_line", "shipping_address_complement", "delivery_instructions", "shipping_rule_id_snapshot", "shipping_rule_level_snapshot", "subtotal", "discount_total", "shipping_fee", "total", "amount_due_now", "amount_paid", "amount_due_on_delivery", "coupon_code", "applied_promotions", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_first_attribution", "utm_last_attribution", "terms_version_accepted", "marketing_consent", "internal_notes", "cancelled_reason", "created_at", "updated_at" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_idx` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_customer_idx` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE TABLE `__new_consent_records` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text,
	`order_id` text,
	`necessary` integer DEFAULT true NOT NULL,
	`analytics` integer DEFAULT false NOT NULL,
	`marketing` integer,
	`policy_version` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_consent_records`("id", "subject_id", "order_id", "necessary", "analytics", "marketing", "policy_version", "created_at") SELECT "id", "subject_id", NULL, "necessary", "analytics", "marketing", "policy_version", "created_at" FROM `consent_records`;--> statement-breakpoint
DROP TABLE `consent_records`;--> statement-breakpoint
ALTER TABLE `__new_consent_records` RENAME TO `consent_records`;--> statement-breakpoint
CREATE INDEX `consent_records_order_idx` ON `consent_records` (`order_id`);--> statement-breakpoint
CREATE INDEX `consent_records_subject_created_idx` ON `consent_records` (`subject_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `payments` ADD `reconciled_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `coupon_redemptions_order_idx` ON `coupon_redemptions` (`order_id`);--> statement-breakpoint
CREATE INDEX `coupon_redemptions_coupon_customer_idx` ON `coupon_redemptions` (`coupon_id`,`customer_id`);