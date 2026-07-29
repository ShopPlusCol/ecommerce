import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";
import { productVariants, products } from "./catalog";
import { customers } from "./customers";

/** Sección 11: carrito persistente entre sesiones, sin cuenta obligatoria. */
export const carts = sqliteTable("carts", {
  id: idColumn(),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  sessionToken: text("session_token").notNull(),
  couponCode: text("coupon_code"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  utmFirstAttribution: text("utm_first_attribution", { mode: "json" }).$type<Record<string, string>>(),
  utmLastAttribution: text("utm_last_attribution", { mode: "json" }).$type<Record<string, string>>(),
  abandonedAt: integer("abandoned_at", { mode: "timestamp_ms" }),
  convertedOrderId: text("converted_order_id"),
  ...timestampColumns,
});

export const cartItems = sqliteTable("cart_items", {
  id: idColumn(),
  cartId: text("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  variantId: text("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull().default(1),
  unitPriceSnapshot: integer("unit_price_snapshot").notNull(),
  ...timestampColumns,
});
