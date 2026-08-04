import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";
import { orders } from "./orders";
import { mediaAssets } from "./content";

/** Sección 18: puede haber varias transacciones por pedido (anticipo + saldo). */
export const payments = sqliteTable(
  "payments",
  {
    id: idColumn(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["mercado_pago", "manual_transfer", "cash_on_delivery"] }).notNull(),
    purpose: text("purpose", { enum: ["shipping_advance", "full_payment", "balance_on_delivery"] }).notNull(),
    amount: integer("amount").notNull(),
    status: text("status", {
      enum: ["pending", "approved", "rejected", "in_process", "refunded", "partially_refunded", "disputed"],
    }).notNull().default("pending"),
    externalReference: text("external_reference").notNull(),
    providerPaymentId: text("provider_payment_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    verifiedByUserId: text("verified_by_user_id"),
    verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
    rejectionReason: text("rejection_reason"),
    // Separado de `status`: `status = "approved"` es lo que informó el
    // proveedor (Mercado Pago) o quien revisó el comprobante; `reconciledAt`
    // marca que TODOS los efectos locales (inventario, pedido, analítica)
    // ya se aplicaron con éxito. Un webhook o revisión puede reintentarse
    // de forma segura mientras `reconciledAt` siga vacío.
    reconciledAt: integer("reconciled_at", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("payments_idempotency_key_idx").on(table.idempotencyKey),
    index("payments_order_idx").on(table.orderId),
    index("payments_external_reference_idx").on(table.externalReference),
  ],
);

export const paymentEvents = sqliteTable(
  "payment_events",
  {
    id: idColumn(),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    rawEventId: text("raw_event_id").notNull(),
    status: text("status").notNull(),
    payload: text("payload", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("payment_events_raw_event_idx").on(table.rawEventId)],
);

export const refunds = sqliteTable("refunds", {
  id: idColumn(),
  paymentId: text("payment_id")
    .notNull()
    .references(() => payments.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] }).notNull().default("pending"),
  requestedByUserId: text("requested_by_user_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Comprobante de transferencia: subirlo nunca aprueba el pago. */
export const manualTransferProofs = sqliteTable("manual_transfer_proofs", {
  id: idColumn(),
  paymentId: text("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }),
  mediaAssetId: text("media_asset_id").notNull().references(() => mediaAssets.id, { onDelete: "restrict" }),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  reviewedByUserId: text("reviewed_by_user_id"),
  reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
  rejectionReason: text("rejection_reason"),
  ...timestampColumns,
}, (table) => [index("manual_transfer_proofs_payment_idx").on(table.paymentId)]);
