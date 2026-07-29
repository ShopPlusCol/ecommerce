import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";
import { products } from "./catalog";

/** Sección 27.3: texturas del simulador (funcionalidad de Fase 4). */
export const tryOnTextures = sqliteTable("try_on_textures", {
  id: idColumn(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  textureUrl: text("texture_url").notNull(),
  maskUrl: text("mask_url"),
  baseSize: integer("base_size"),
  opacity: integer("opacity").notNull().default(85),
  blendMode: text("blend_mode").default("multiply"),
  reviewStatus: text("review_status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  ...timestampColumns,
});

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
