import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";
import { orders } from "./orders";

/** Configuración general editable (sección 25), clave/valor tipado por JSON. */
export const settings = sqliteTable(
  "settings",
  {
    key: text("key").primaryKey(),
    value: text("value", { mode: "json" }).$type<unknown>().notNull(),
    updatedByUserId: text("updated_by_user_id"),
    ...timestampColumns,
  },
);

/** Sección 21: estado de integraciones externas, nunca el secreto en sí. */
export const integrationSettings = sqliteTable(
  "integration_settings",
  {
    id: idColumn(),
    provider: text("provider", { enum: ["mercado_pago", "meta_conversions_api", "whatsapp", "smtp"] }).notNull(),
    isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(false),
    isTestMode: integer("is_test_mode", { mode: "boolean" }).notNull().default(true),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
    lastCheckedAt: integer("last_checked_at", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("integration_settings_provider_idx").on(table.provider)],
);

export const webhookEvents = sqliteTable(
  "webhook_events",
  {
    id: idColumn(),
    provider: text("provider").notNull(),
    externalEventId: text("external_event_id").notNull(),
    payload: text("payload", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    processedAt: integer("processed_at", { mode: "timestamp_ms" }),
    status: text("status", { enum: ["received", "processed", "failed"] }).notNull().default("received"),
    error: text("error"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("webhook_events_provider_external_idx").on(table.provider, table.externalEventId)],
);

/** Sección 21.2: eventos de conversión enviados (Meta Pixel / Conversions API). */
export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: idColumn(),
    eventName: text("event_name").notNull(),
    eventId: text("event_id").notNull(),
    orderId: text("order_id"),
    value: integer("value"),
    currency: text("currency").default("COP"),
    utmSource: text("utm_source"),
    utmCampaign: text("utm_campaign"),
    sentToServer: integer("sent_to_server", { mode: "boolean" }).notNull().default(false),
    sentToBrowser: integer("sent_to_browser", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("analytics_events_event_id_idx").on(table.eventId),
    index("analytics_events_name_idx").on(table.eventName),
  ],
);

export const consentRecords = sqliteTable(
  "consent_records",
  {
    id: idColumn(),
    subjectId: text("subject_id"),
    // Vincula el registro a un pedido concreto cuando se conoce (checkout):
    // permite consultar el consentimiento correspondiente a ESE pedido en
    // vez de "el más reciente del cliente" o una fila arbitraria. Los
    // registros históricos previos a esta columna quedan con orderId nulo.
    orderId: text("order_id").references(() => orders.id, { onDelete: "cascade" }),
    necessary: integer("necessary", { mode: "boolean" }).notNull().default(true),
    analytics: integer("analytics", { mode: "boolean" }).notNull().default(false),
    // null = la casilla no se mostró (campo desactivado en configuración);
    // no equivale a "el cliente dijo que no".
    marketing: integer("marketing", { mode: "boolean" }),
    policyVersion: text("policy_version").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("consent_records_order_idx").on(table.orderId),
    index("consent_records_subject_created_idx").on(table.subjectId, table.createdAt),
  ],
);

/** Sección 30.3: auditoría de acciones sensibles. */
export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: idColumn(),
    userId: text("user_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    before: text("before", { mode: "json" }).$type<Record<string, unknown>>(),
    after: text("after", { mode: "json" }).$type<Record<string, unknown>>(),
    reason: text("reason"),
    correlationId: text("correlation_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

/** Idempotencia genérica para creación de pedidos, pagos y webhooks. */
export const idempotencyKeys = sqliteTable("idempotency_keys", {
  key: text("key").primaryKey(),
  scope: text("scope").notNull(),
  responseSnapshot: text("response_snapshot", { mode: "json" }).$type<unknown>(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Contadores efímeros y anonimizados para limitar abuso en rutas públicas. */
export const requestRateLimits = sqliteTable("request_rate_limits", {
  key: text("key").primaryKey(),
  scope: text("scope").notNull(),
  count: integer("count").notNull().default(1),
  resetAt: integer("reset_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
