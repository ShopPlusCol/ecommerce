ALTER TABLE `analytics_events` ADD `delivery_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD `attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD `last_attempt_at` integer;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD `next_retry_at` integer;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD `last_error_code` text;--> statement-breakpoint
CREATE INDEX `analytics_events_delivery_idx` ON `analytics_events` (`delivery_status`,`next_retry_at`);--> statement-breakpoint
-- Backfill: una fila existente con sent_to_server = 1 ya se entregó a Meta.
-- Sin esto quedaría como 'pending' y la recuperación de pendientes volvería
-- a enviar compras antiguas.
UPDATE `analytics_events` SET `delivery_status` = 'sent', `attempts` = 1 WHERE `sent_to_server` = 1;--> statement-breakpoint
-- Las que nunca se enviaron quedan disponibles para reintento inmediato.
UPDATE `analytics_events` SET `delivery_status` = 'pending' WHERE `sent_to_server` = 0;
