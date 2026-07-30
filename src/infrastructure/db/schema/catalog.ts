import { integer, sqliteTable, text, uniqueIndex, index, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { idColumn, moneyColumn, timestampColumns } from "./_helpers";

/** Sección 8.3: familias de color, editables, nunca hardcodeadas. */
export const colorFamilies = sqliteTable(
  "color_families",
  {
    id: idColumn(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    hexSwatch: text("hex_swatch"),
    order: integer("order").notNull().default(0),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("color_families_slug_idx").on(table.slug)],
);

/** Sección 8.3 / 28.6: árbol de categorías, con auto-referencia al padre. */
export const categories = sqliteTable(
  "categories",
  {
    id: idColumn(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    parentId: text("parent_id").references((): AnySQLiteColumn => categories.id, { onDelete: "set null" }),
    imageUrl: text("image_url"),
    icon: text("icon"),
    order: integer("order").notNull().default(0),
    visibleInMenu: integer("visible_in_menu", { mode: "boolean" }).notNull().default(true),
    visibleInFilters: integer("visible_in_filters", { mode: "boolean" }).notNull().default(true),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("categories_slug_idx").on(table.slug),
    index("categories_parent_idx").on(table.parentId),
  ],
);

export const products = sqliteTable(
  "products",
  {
    id: idColumn(),
    slug: text("slug").notNull(),
    sku: text("sku").notNull(),
    status: text("status", { enum: ["draft", "active", "archived"] }).notNull().default("draft"),
    name: text("name").notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    price: moneyColumn("price"),
    compareAtPrice: integer("compare_at_price"),
    costPrice: integer("cost_price"),
    promoStartsAt: integer("promo_starts_at", { mode: "timestamp_ms" }),
    promoEndsAt: integer("promo_ends_at", { mode: "timestamp_ms" }),
    colorFamilyId: text("color_family_id").references(() => colorFamilies.id, { onDelete: "set null" }),
    /**
     * Límite de venta cruzada (sección 11.2): cuántas unidades de ESTE
     * producto se pueden agregar por cada unidad de `limitCategoryId` en el
     * carrito. Ambos deben tener valor para que el límite aplique; se valida
     * en cliente (sección 4.2) y de nuevo en servidor antes de crear el
     * pedido (sección 29), nunca solo en el navegador.
     */
    limitCategoryId: text("limit_category_id").references((): AnySQLiteColumn => categories.id, { onDelete: "set null" }),
    maxUnitsPerCategoryUnit: integer("max_units_per_category_unit"),
    allowBackorder: integer("allow_backorder", { mode: "boolean" }).notNull().default(false),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    weightGrams: integer("weight_grams"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    order: integer("order").notNull().default(0),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    uniqueIndex("products_sku_idx").on(table.sku),
    index("products_status_idx").on(table.status),
    index("products_color_family_idx").on(table.colorFamilyId),
  ],
);

/** Variantes por producto (p. ej. graduación futura, tamaño de kit). */
export const productVariants = sqliteTable(
  "product_variants",
  {
    id: idColumn(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    priceOverride: integer("price_override"),
    order: integer("order").notNull().default(0),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("product_variants_sku_idx").on(table.sku)],
);

export const productMedia = sqliteTable(
  "product_media",
  {
    id: idColumn(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    altText: text("alt_text").notNull().default(""),
    order: integer("order").notNull().default(0),
    isVideoPoster: integer("is_video_poster", { mode: "boolean" }).notNull().default(false),
    ...timestampColumns,
  },
  (table) => [index("product_media_product_idx").on(table.productId)],
);

/** Atributos configurables (sección 23.1): definición + valor por producto (EAV controlado). */
export const attributeDefinitions = sqliteTable(
  "attribute_definitions",
  {
    id: idColumn(),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    valueType: text("value_type", { enum: ["text", "number", "boolean", "select"] }).notNull(),
    options: text("options", { mode: "json" }).$type<string[]>(),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("attribute_definitions_slug_idx").on(table.slug)],
);

export const productAttributes = sqliteTable(
  "product_attributes",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    attributeId: text("attribute_id")
      .notNull()
      .references(() => attributeDefinitions.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
  },
  (table) => [uniqueIndex("product_attributes_pk_idx").on(table.productId, table.attributeId)],
);

export const productCategories = sqliteTable(
  "product_categories",
  {
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("product_categories_pk_idx").on(table.productId, table.categoryId)],
);

export const collections = sqliteTable(
  "collections",
  {
    id: idColumn(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type", { enum: ["manual", "dynamic"] }).notNull().default("manual"),
    ruleDefinition: text("rule_definition", { mode: "json" }).$type<Record<string, unknown>>(),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("collections_slug_idx").on(table.slug)],
);

export const collectionProducts = sqliteTable(
  "collection_products",
  {
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    order: integer("order").notNull().default(0),
  },
  (table) => [uniqueIndex("collection_products_pk_idx").on(table.collectionId, table.productId)],
);

/** Sección 11.2 y 24: recomendaciones/upsell configurables por alcance. */
export const recommendationRules = sqliteTable("recommendation_rules", {
  id: idColumn(),
  scope: text("scope", { enum: ["global", "category", "product", "cart", "collection"] }).notNull(),
  scopeReferenceId: text("scope_reference_id"),
  recommendedProductId: text("recommended_product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  placement: text("placement", { enum: ["card", "product_page", "cart", "checkout"] }).notNull(),
  promoText: text("promo_text"),
  order: integer("order").notNull().default(0),
  maxSuggestions: integer("max_suggestions").notNull().default(3),
  startsAt: integer("starts_at", { mode: "timestamp_ms" }),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }),
  status: text("status", { enum: ["draft", "active", "paused"] }).notNull().default("draft"),
  ...timestampColumns,
});
