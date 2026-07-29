import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";
import { customers } from "./customers";

export const ORDER_STATUSES = [
  "draft",
  "pending_payment",
  "partial_payment_required",
  "payment_in_review",
  "confirmed",
  "in_preparation",
  "ready_for_dispatch",
  "dispatched",
  "in_transit",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
  "incident",
] as const;

export const PAYMENT_STATUSES = [
  "unpaid",
  "advance_pending",
  "advance_approved",
  "full_payment_pending",
  "paid",
  "partially_paid",
  "rejected",
  "partially_refunded",
  "refunded",
  "disputed",
] as const;

/**
 * Sección 19.2: el pedido guarda una instantánea completa. Un cambio
 * posterior en catálogo, zonas o promociones nunca debe alterar estos
 * valores; por eso casi todo se guarda como snapshot en JSON o columnas
 * propias, no como referencias vivas.
 */
export const orders = sqliteTable(
  "orders",
  {
    id: idColumn(),
    orderNumber: text("order_number").notNull(),
    customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
    status: text("status", { enum: ORDER_STATUSES }).notNull().default("draft"),
    paymentStatus: text("payment_status", { enum: PAYMENT_STATUSES }).notNull().default("unpaid"),
    deliveryMethod: text("delivery_method", { enum: ["delivery", "pickup"] }).notNull(),

    customerFullName: text("customer_full_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    shippingDepartment: text("shipping_department"),
    shippingCity: text("shipping_city"),
    shippingNeighborhood: text("shipping_neighborhood"),
    shippingAddressLine: text("shipping_address_line"),
    shippingAddressComplement: text("shipping_address_complement"),
    deliveryInstructions: text("delivery_instructions"),

    shippingRuleIdSnapshot: text("shipping_rule_id_snapshot"),
    shippingRuleLevelSnapshot: text("shipping_rule_level_snapshot"),

    subtotal: integer("subtotal").notNull(),
    discountTotal: integer("discount_total").notNull().default(0),
    shippingFee: integer("shipping_fee").notNull().default(0),
    total: integer("total").notNull(),
    amountDueNow: integer("amount_due_now").notNull(),
    amountPaid: integer("amount_paid").notNull().default(0),
    amountDueOnDelivery: integer("amount_due_on_delivery").notNull().default(0),

    couponCode: text("coupon_code"),
    appliedPromotions: text("applied_promotions", { mode: "json" }).$type<string[]>(),

    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),

    termsVersionAccepted: text("terms_version_accepted"),
    marketingConsent: integer("marketing_consent", { mode: "boolean" }).notNull().default(false),
    internalNotes: text("internal_notes"),
    cancelledReason: text("cancelled_reason"),

    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("orders_order_number_idx").on(table.orderNumber),
    index("orders_status_idx").on(table.status),
    index("orders_customer_idx").on(table.customerId),
  ],
);

/** Instantánea de producto en el momento de la compra (nombre, SKU, precio). */
export const orderItems = sqliteTable("order_items", {
  id: idColumn(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id"),
  variantId: text("variant_id"),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  colorFamilyName: text("color_family_name"),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  discount: integer("discount").notNull().default(0),
  isGift: integer("is_gift", { mode: "boolean" }).notNull().default(false),
});

export const orderAdjustments = sqliteTable("order_adjustments", {
  id: idColumn(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["coupon", "promotion", "reward", "manual_discount", "shipping_override"],
  }).notNull(),
  label: text("label").notNull(),
  amount: integer("amount").notNull(),
  sourceId: text("source_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orderStatusHistory = sqliteTable("order_status_history", {
  id: idColumn(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  changedByUserId: text("changed_by_user_id"),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
