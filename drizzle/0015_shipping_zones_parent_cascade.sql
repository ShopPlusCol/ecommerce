-- La migración 0012 agregó `parent_zone_id` vía `ALTER TABLE ... ADD COLUMN`
-- sin `ON DELETE CASCADE` (SQLite no aplica esa cláusula en un ADD COLUMN
-- para una referencia a la propia tabla), aunque el esquema de Drizzle
-- siempre la declaró. Efecto real: eliminar un departamento o ciudad con
-- hijos fallaba con "FOREIGN KEY constraint failed" en vez de borrar en
-- cascada. Se reconstruye la tabla con la cláusula correcta.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_shipping_zones` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`level` text NOT NULL,
	`country` text DEFAULT 'CO' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`parent_zone_id` text REFERENCES shipping_zones(id) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_shipping_zones`("id", "name", "level", "country", "status", "created_at", "updated_at", "parent_zone_id") SELECT "id", "name", "level", "country", "status", "created_at", "updated_at", "parent_zone_id" FROM `shipping_zones`;--> statement-breakpoint
DROP TABLE `shipping_zones`;--> statement-breakpoint
ALTER TABLE `__new_shipping_zones` RENAME TO `shipping_zones`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `shipping_zones_level_idx` ON `shipping_zones` (`level`);--> statement-breakpoint
CREATE INDEX `shipping_zones_parent_idx` ON `shipping_zones` (`parent_zone_id`);