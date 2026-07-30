import { integer, sqliteTable, text, index, uniqueIndex, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";
import { orders } from "./orders";

/**
 * Árbol real de zonas: Departamento (raíz) › Ciudad o municipio › Barrio,
 * más un nivel "country" sin padre como respaldo nacional (sección 17).
 * `parentZoneId` es la única fuente de jerarquía; el `name` de cada zona es
 * su propio nombre (no hay campos de coincidencia de texto contra el
 * destino en niveles separados).
 */
export const shippingZones = sqliteTable(
  "shipping_zones",
  {
    id: idColumn(),
    name: text("name").notNull(),
    level: text("level", { enum: ["country", "department", "city", "neighborhood"] }).notNull(),
    parentZoneId: text("parent_zone_id").references((): AnySQLiteColumn => shippingZones.id, { onDelete: "cascade" }),
    country: text("country").notNull().default("CO"),
    status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
    ...timestampColumns,
  },
  (table) => [
    index("shipping_zones_level_idx").on(table.level),
    index("shipping_zones_parent_idx").on(table.parentZoneId),
  ],
);

/**
 * Configuración propia de una zona (a lo sumo una fila por zona). Cada
 * campo es opcional: `null` significa "hereda de la zona padre más
 * cercana que tenga un valor propio"; un valor no nulo es la
 * personalización de esa zona. Sin fila = hereda todo. Ver
 * `resolveShippingQuote` para el recorrido del árbol.
 */
export const shippingRules = sqliteTable(
  "shipping_rules",
  {
    id: idColumn(),
    zoneId: text("zone_id")
      .notNull()
      .references(() => shippingZones.id, { onDelete: "cascade" }),
    fee: integer("fee"),
    freeShippingThreshold: integer("free_shipping_threshold"),
    coverage: text("coverage", { enum: ["available", "unavailable"] }),
    cashOnDeliveryAllowed: integer("cash_on_delivery_allowed", { mode: "boolean" }),
    requiresAdvancePayment: integer("requires_advance_payment", { mode: "boolean" }),
    advancePercentage: integer("advance_percentage"),
    sameDayAvailable: integer("same_day_available", { mode: "boolean" }),
    sameDayCutoffHour: integer("same_day_cutoff_hour"),
    estimatedBusinessDaysMin: integer("estimated_business_days_min"),
    estimatedBusinessDaysMax: integer("estimated_business_days_max"),
    allowedPaymentMethods: text("allowed_payment_methods", { mode: "json" }).$type<
      Array<"mercado_pago" | "cash_on_delivery" | "shipping_advance_transfer" | "transfer_full">
    >(),
    customerMessage: text("customer_message"),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("shipping_rules_zone_id_unique").on(table.zoneId)],
);

export const shipments = sqliteTable("shipments", {
  id: idColumn(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  carrier: text("carrier"),
  trackingCode: text("tracking_code"),
  dispatchedAt: integer("dispatched_at", { mode: "timestamp_ms" }),
  deliveredAt: integer("delivered_at", { mode: "timestamp_ms" }),
  status: text("status", {
    enum: ["pending", "dispatched", "in_transit", "delivered", "failed"],
  }).notNull().default("pending"),
  ...timestampColumns,
});
