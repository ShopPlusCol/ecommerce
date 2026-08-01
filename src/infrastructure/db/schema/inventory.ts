import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";
import { productVariants, products } from "./catalog";

/** Sección 19.4: stock disponible/reservado/vendido por producto o variante. */
export const inventoryItems = sqliteTable(
  "inventory_items",
  {
    id: idColumn(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
    quantityOnHand: integer("quantity_on_hand").notNull().default(0),
    quantityReserved: integer("quantity_reserved").notNull().default(0),
    quantitySold: integer("quantity_sold").notNull().default(0),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("inventory_items_product_variant_idx").on(table.productId, table.variantId)],
);

export const inventoryMovements = sqliteTable("inventory_movements", {
  id: idColumn(),
  inventoryItemId: text("inventory_item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["restock", "sale", "reservation", "release", "manual_adjustment", "return"],
  }).notNull(),
  quantityDelta: integer("quantity_delta").notNull(),
  reason: text("reason"),
  referenceOrderId: text("reference_order_id"),
  createdByUserId: text("created_by_user_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Reserva temporal creada por checkout; expira y puede liberarse sin alterar ventas. */
export const inventoryReservations = sqliteTable(
  "inventory_reservations",
  {
    id: idColumn(),
    inventoryItemId: text("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),
    orderId: text("order_id").notNull(),
    quantity: integer("quantity").notNull(),
    status: text("status", { enum: ["active", "consumed", "released"] }).notNull().default("active"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ...timestampColumns,
  },
  (table) => [
    index("inventory_reservations_order_idx").on(table.orderId),
    index("inventory_reservations_status_expires_idx").on(table.status, table.expiresAt),
  ],
);
