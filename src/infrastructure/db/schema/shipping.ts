import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";
import { orders } from "./orders";

/**
 * Sección 17: jerarquía país › departamento › ciudad › barrio › excepción.
 * La regla más específica que aplique gana; si ninguna aplica, el checkout
 * no debe inventar tarifa (sección 17.1).
 */
export const shippingZones = sqliteTable(
  "shipping_zones",
  {
    id: idColumn(),
    name: text("name").notNull(),
    level: text("level", { enum: ["country", "department", "city", "neighborhood"] }).notNull(),
    country: text("country").notNull().default("CO"),
    department: text("department"),
    city: text("city"),
    neighborhood: text("neighborhood"),
    /**
     * Para zonas de nivel "neighborhood": lista de barrios que comparten esta
     * fila (un "grupo"). Reemplaza a `neighborhood` (que se conserva solo por
     * compatibilidad) como fuente de verdad para la coincidencia del checkout
     * y para las tarifas por grupo de barrios (sección 17.5).
     */
    neighborhoodNames: text("neighborhood_names", { mode: "json" }).$type<string[]>(),
    /**
     * Marca los dos grupos reservados por ciudad que administra el tablero de
     * `/admin/envios`: "unassigned" (barrios sin grupo propio, usan la tarifa
     * de ciudad) y "no_coverage" (barrios sin servicio). El resto son grupos
     * personalizados creados por el propietario.
     */
    groupKind: text("group_kind", { enum: ["custom", "unassigned", "no_coverage"] }).notNull().default("custom"),
    status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
    ...timestampColumns,
  },
  (table) => [
    index("shipping_zones_level_idx").on(table.level),
    index("shipping_zones_city_idx").on(table.city),
  ],
);

export const shippingRules = sqliteTable(
  "shipping_rules",
  {
    id: idColumn(),
    zoneId: text("zone_id")
      .notNull()
      .references(() => shippingZones.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    fee: integer("fee").notNull().default(0),
    freeShippingThreshold: integer("free_shipping_threshold"),
    cashOnDeliveryAllowed: integer("cash_on_delivery_allowed", { mode: "boolean" }).notNull().default(false),
    requiresAdvancePayment: integer("requires_advance_payment", { mode: "boolean" }).notNull().default(false),
    advancePercentage: integer("advance_percentage"),
    sameDayAvailable: integer("same_day_available", { mode: "boolean" }).notNull().default(false),
    sameDayCutoffHour: integer("same_day_cutoff_hour"),
    estimatedBusinessDaysMin: integer("estimated_business_days_min").notNull().default(1),
    estimatedBusinessDaysMax: integer("estimated_business_days_max").notNull().default(3),
    operatingDays: text("operating_days", { mode: "json" }).$type<number[]>(),
    surcharge: integer("surcharge").notNull().default(0),
    minOrderAmount: integer("min_order_amount"),
    maxOrderAmount: integer("max_order_amount"),
    excludedProductIds: text("excluded_product_ids", { mode: "json" }).$type<string[]>(),
    allowedPaymentMethods: text("allowed_payment_methods", { mode: "json" })
      .$type<Array<"mercado_pago" | "cash_on_delivery" | "shipping_advance_transfer" | "transfer_full">>()
      .notNull()
      .default(["mercado_pago", "cash_on_delivery", "shipping_advance_transfer", "transfer_full"]),
    customerMessage: text("customer_message"),
    internalInstructions: text("internal_instructions"),
    priority: integer("priority").notNull().default(0),
    /**
     * Cuando es verdadero, esta regla no representa una tarifa: significa
     * "sin cobertura" para su zona/grupo. Si gana la resolución (zona más
     * específica), el checkout no debe heredar la tarifa de un nivel más
     * amplio; debe responder "sin tarifa disponible" (sección 17.5).
     */
    blocksDelivery: integer("blocks_delivery", { mode: "boolean" }).notNull().default(false),
    status: text("status", { enum: ["draft", "active", "inactive"] }).notNull().default("draft"),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [index("shipping_rules_zone_idx").on(table.zoneId)],
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
