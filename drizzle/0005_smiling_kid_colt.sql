PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_try_on_textures` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`media_asset_id` text,
	`texture_url` text NOT NULL,
	`mask_url` text,
	`base_size` integer DEFAULT 100 NOT NULL,
	`opacity` integer DEFAULT 85 NOT NULL,
	`blend_mode` text DEFAULT 'multiply' NOT NULL,
	`scale_x` integer DEFAULT 100 NOT NULL,
	`scale_y` integer DEFAULT 100 NOT NULL,
	`rotation_offset` integer DEFAULT 0 NOT NULL,
	`perspective_strength` integer DEFAULT 0 NOT NULL,
	`color_correction` text NOT NULL,
	`review_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_asset_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_try_on_textures`("id", "product_id", "media_asset_id", "texture_url", "mask_url", "base_size", "opacity", "blend_mode", "scale_x", "scale_y", "rotation_offset", "perspective_strength", "color_correction", "review_status", "created_at", "updated_at")
SELECT "id", "product_id", NULL, "texture_url", "mask_url", COALESCE("base_size", 100), "opacity",
	COALESCE("blend_mode", 'multiply'), 100, 100, 0, 0, '{}', "review_status", "created_at", "updated_at"
FROM `try_on_textures`;--> statement-breakpoint
DROP TABLE `try_on_textures`;--> statement-breakpoint
ALTER TABLE `__new_try_on_textures` RENAME TO `try_on_textures`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `try_on_textures_product_idx` ON `try_on_textures` (`product_id`);
