import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";

/** Sección 15: editor visual por bloques. `pages` incluye el inicio. */
export const pages = sqliteTable(
  "pages",
  {
    id: idColumn(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    isHome: integer("is_home", { mode: "boolean" }).notNull().default(false),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    publishedVersionId: text("published_version_id"),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("pages_slug_idx").on(table.slug)],
);

/** Cada publicación crea una nueva versión inmutable (historial + restauración). */
export const pageVersions = sqliteTable(
  "page_versions",
  {
    id: idColumn(),
    pageId: text("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    createdByUserId: text("created_by_user_id"),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("page_versions_page_idx").on(table.pageId)],
);

/** Bloques individuales de una versión (sección 15.2/15.3), ordenados. */
export const pageSections = sqliteTable(
  "page_sections",
  {
    id: idColumn(),
    pageVersionId: text("page_version_id")
      .notNull()
      .references(() => pageVersions.id, { onDelete: "cascade" }),
    blockType: text("block_type").notNull(),
    order: integer("order").notNull().default(0),
    config: text("config", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    visibleOnMobile: integer("visible_on_mobile", { mode: "boolean" }).notNull().default(true),
    visibleOnDesktop: integer("visible_on_desktop", { mode: "boolean" }).notNull().default(true),
    ...timestampColumns,
  },
  (table) => [index("page_sections_version_idx").on(table.pageVersionId)],
);

export const navigationMenus = sqliteTable("navigation_menus", {
  id: idColumn(),
  key: text("key").notNull(),
  label: text("label").notNull(),
  href: text("href").notNull(),
  order: integer("order").notNull().default(0),
  openInNewTab: integer("open_in_new_tab", { mode: "boolean" }).notNull().default(false),
  parentId: text("parent_id"),
  ...timestampColumns,
});

export const testimonials = sqliteTable("testimonials", {
  id: idColumn(),
  customerName: text("customer_name").notNull(),
  city: text("city"),
  quote: text("quote").notNull(),
  rating: integer("rating"),
  order: integer("order").notNull().default(0),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  ...timestampColumns,
});

export const faqs = sqliteTable("faqs", {
  id: idColumn(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category"),
  order: integer("order").notNull().default(0),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  ...timestampColumns,
});

/** Sección 23.4: activos subidos vía adaptador S3-compatible (R2/local). */
export const mediaAssets = sqliteTable("media_assets", {
  id: idColumn(),
  storageKey: text("storage_key").notNull(),
  url: text("url").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  altText: text("alt_text"),
  width: integer("width"),
  height: integer("height"),
  uploadedByUserId: text("uploaded_by_user_id"),
  ...timestampColumns,
});
