CREATE TABLE `manual_transfer_proofs` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text NOT NULL,
	`media_asset_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by_user_id` text,
	`reviewed_at` integer,
	`rejection_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_asset_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE restrict
);
