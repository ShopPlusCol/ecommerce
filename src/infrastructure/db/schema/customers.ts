import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";

/** Sección 26: ficha de cliente creada sin necesidad de cuenta. */
export const customers = sqliteTable(
  "customers",
  {
    id: idColumn(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    marketingConsent: integer("marketing_consent", { mode: "boolean" }).notNull().default(false),
    tags: text("tags", { mode: "json" }).$type<string[]>(),
    internalNotes: text("internal_notes"),
    blockedAt: integer("blocked_at", { mode: "timestamp_ms" }),
    blockedReason: text("blocked_reason"),
    firstOrderAt: integer("first_order_at", { mode: "timestamp_ms" }),
    lastOrderAt: integer("last_order_at", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [index("customers_phone_idx").on(table.phone), index("customers_email_idx").on(table.email)],
);

export const customerAddresses = sqliteTable("customer_addresses", {
  id: idColumn(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  label: text("label"),
  department: text("department").notNull(),
  city: text("city").notNull(),
  neighborhood: text("neighborhood"),
  addressLine: text("address_line").notNull(),
  addressComplement: text("address_complement"),
  deliveryInstructions: text("delivery_instructions"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  ...timestampColumns,
});
