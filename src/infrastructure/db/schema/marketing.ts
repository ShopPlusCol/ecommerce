import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";
import { orders } from "./orders";

/** Sección 13: cupones y códigos de creadores. */
export const coupons = sqliteTable(
  "coupons",
  {
    id: idColumn(),
    code: text("code").notNull(),
    discountType: text("discount_type", { enum: ["fixed", "percentage", "free_shipping", "gift"] }).notNull(),
    discountValue: integer("discount_value").notNull().default(0),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }),
    usageLimitTotal: integer("usage_limit_total"),
    usageLimitPerCustomer: integer("usage_limit_per_customer"),
    minPurchaseAmount: integer("min_purchase_amount"),
    minQuantity: integer("min_quantity"),
    firstOrderOnly: integer("first_order_only", { mode: "boolean" }).notNull().default(false),
    combinable: integer("combinable", { mode: "boolean" }).notNull().default(false),
    priority: integer("priority").notNull().default(0),
    status: text("status", {
      enum: ["draft", "scheduled", "active", "paused", "expired"],
    }).notNull().default("draft"),
    attributedTo: text("attributed_to"),
    internalTags: text("internal_tags", { mode: "json" }).$type<string[]>(),
    internalNotes: text("internal_notes"),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("coupons_code_idx").on(table.code)],
);

export const couponScopes = sqliteTable("coupon_scopes", {
  id: idColumn(),
  couponId: text("coupon_id")
    .notNull()
    .references(() => coupons.id, { onDelete: "cascade" }),
  scopeType: text("scope_type", {
    enum: ["include_product", "exclude_product", "include_category", "exclude_category", "zone", "payment_method"],
  }).notNull(),
  referenceId: text("reference_id").notNull(),
});

export const couponRedemptions = sqliteTable(
  "coupon_redemptions",
  {
    id: idColumn(),
    couponId: text("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    customerId: text("customer_id"),
    discountAmount: integer("discount_amount").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("coupon_redemptions_coupon_idx").on(table.couponId)],
);

/**
 * Campaña de marketing (sección 22.3, ítem "Promociones" del panel):
 * agrupa cupones y reglas de recompensa bajo un mismo nombre e intervalo,
 * para reportar "promociones activadas y redimidas" (sección 3.1) sin
 * duplicar la lógica de descuento, que vive en `coupons` y `reward_rules`.
 */
export const promotions = sqliteTable("promotions", {
  id: idColumn(),
  name: text("name").notNull(),
  description: text("description"),
  bannerImageUrl: text("banner_image_url"),
  relatedCouponIds: text("related_coupon_ids", { mode: "json" }).$type<string[]>(),
  relatedRewardRuleIds: text("related_reward_rule_ids", { mode: "json" }).$type<string[]>(),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }),
  status: text("status", { enum: ["draft", "scheduled", "active", "ended"] }).notNull().default("draft"),
  ...timestampColumns,
});

/** Sección 12: motor de recompensas/barra de progreso. */
export const rewardRules = sqliteTable("reward_rules", {
  id: idColumn(),
  name: text("name").notNull(),
  progressMessage: text("progress_message").notNull(),
  unlockedMessage: text("unlocked_message").notNull(),
  conditionType: text("condition_type", {
    enum: ["cart_amount", "item_count", "category", "zone", "campaign"],
  }).notNull(),
  targetValue: integer("target_value").notNull(),
  eligibleProductIds: text("eligible_product_ids", { mode: "json" }).$type<string[]>(),
  eligibleCategoryIds: text("eligible_category_ids", { mode: "json" }).$type<string[]>(),
  rewardType: text("reward_type", {
    enum: ["free_shipping", "free_product", "fixed_discount", "percentage_discount"],
  }).notNull(),
  rewardValue: integer("reward_value"),
  rewardProductId: text("reward_product_id"),
  priority: integer("priority").notNull().default(0),
  combinable: integer("combinable", { mode: "boolean" }).notNull().default(false),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }),
  usageLimitTotal: integer("usage_limit_total"),
  usageLimitPerCustomer: integer("usage_limit_per_customer"),
  validPaymentMethods: text("valid_payment_methods", { mode: "json" }).$type<string[]>(),
  validShippingMethods: text("valid_shipping_methods", { mode: "json" }).$type<string[]>(),
  status: text("status", { enum: ["draft", "active", "paused"] }).notNull().default("draft"),
  ...timestampColumns,
});

export const rewardRedemptions = sqliteTable("reward_redemptions", {
  id: idColumn(),
  rewardRuleId: text("reward_rule_id")
    .notNull()
    .references(() => rewardRules.id, { onDelete: "cascade" }),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  benefitAmount: integer("benefit_amount").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Sección 14: pop-ups y banners promocionales. */
export const popups = sqliteTable("popups", {
  id: idColumn(),
  name: text("name").notNull(),
  imageUrlMobile: text("image_url_mobile"),
  imageUrlDesktop: text("image_url_desktop"),
  title: text("title"),
  body: text("body"),
  ctaLabel: text("cta_label"),
  ctaHref: text("cta_href"),
  couponId: text("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
  includedPaths: text("included_paths", { mode: "json" }).$type<string[]>(),
  excludedPaths: text("excluded_paths", { mode: "json" }).$type<string[]>(),
  frequency: text("frequency", { enum: ["once_per_session", "once_per_period", "always"] }).notNull().default("once_per_session"),
  delaySeconds: integer("delay_seconds").notNull().default(0),
  triggerOnScrollPercent: integer("trigger_on_scroll_percent"),
  triggerOnExitIntent: integer("trigger_on_exit_intent", { mode: "boolean" }).notNull().default(false),
  utmConditions: text("utm_conditions", { mode: "json" }).$type<Record<string, string>>(),
  priority: integer("priority").notNull().default(0),
  status: text("status", { enum: ["draft", "active", "paused", "expired"] }).notNull().default("draft"),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }),
  ...timestampColumns,
});
