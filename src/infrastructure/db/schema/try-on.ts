import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";
import { products } from "./catalog";
import { mediaAssets } from "./content";

/** Sección 27.3: texturas del simulador (funcionalidad de Fase 4). */
export const tryOnTextures = sqliteTable(
  "try_on_textures",
  {
    id: idColumn(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaAssetId: text("media_asset_id").references(() => mediaAssets.id, { onDelete: "set null" }),
    textureUrl: text("texture_url").notNull(),
    maskUrl: text("mask_url"),
    baseSize: integer("base_size").notNull().default(100),
    opacity: integer("opacity").notNull().default(85),
    blendMode: text("blend_mode", { enum: ["multiply", "overlay", "soft-light", "source-over"] })
      .notNull()
      .default("multiply"),
    scaleX: integer("scale_x").notNull().default(100),
    scaleY: integer("scale_y").notNull().default(100),
    rotationOffset: integer("rotation_offset").notNull().default(0),
    perspectiveStrength: integer("perspective_strength").notNull().default(0),
    colorCorrection: text("color_correction", { mode: "json" })
      .$type<{ tint?: string; saturation?: number; brightness?: number }>()
      .notNull()
      .$defaultFn(() => ({})),
    reviewStatus: text("review_status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("try_on_textures_product_idx").on(table.productId)],
);

/** Sección 27.2: subidas temporales del simulador, con expiración obligatoria. */
export const temporaryUploads = sqliteTable("temporary_uploads", {
  id: idColumn(),
  storageKey: text("storage_key").notNull(),
  purpose: text("purpose", { enum: ["try_on_photo"] }).notNull(),
  consentRecordId: text("consent_record_id"),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
