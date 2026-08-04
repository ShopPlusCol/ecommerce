CREATE INDEX `inventory_reservations_order_idx` ON `inventory_reservations` (`order_id`);--> statement-breakpoint
CREATE INDEX `inventory_reservations_status_expires_idx` ON `inventory_reservations` (`status`,`expires_at`);--> statement-breakpoint
CREATE INDEX `carts_session_token_idx` ON `carts` (`session_token`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `manual_transfer_proofs_payment_idx` ON `manual_transfer_proofs` (`payment_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);