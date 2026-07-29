"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, mediaAssets, products, tryOnTextures } from "@/infrastructure/db/schema";
import { getStorageProvider } from "@/infrastructure/storage";
import { requirePermission } from "@/modules/auth/session";
import { validateMedia } from "@/modules/media/validation";

const MAX_TEXTURE_BYTES = 2 * 1024 * 1024;
const TEXTURE_TYPES = new Set(["image/png", "image/webp"]);

const textureSchema = z.object({
  productId: z.string().min(1),
  baseSize: z.coerce.number().int().min(60).max(180),
  opacity: z.coerce.number().int().min(20).max(100),
  blendMode: z.enum(["multiply", "overlay", "soft-light", "source-over"]),
  scaleX: z.coerce.number().int().min(60).max(180),
  scaleY: z.coerce.number().int().min(60).max(180),
  offsetX: z.coerce.number().int().min(-20).max(20),
  offsetY: z.coerce.number().int().min(-20).max(20),
  rotationOffset: z.coerce.number().int().min(-45).max(45),
  perspectiveStrength: z.coerce.number().int().min(-50).max(50),
  tint: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
  saturation: z.coerce.number().int().min(40).max(180),
  brightness: z.coerce.number().int().min(40).max(180),
  reviewStatus: z.enum(["pending", "approved", "rejected"]),
});

export async function saveTryOnTextureAction(formData: FormData) {
  const session = await requirePermission("catalog", "update");
  const parsed = textureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Configuración inválida; revisa escalas, color y opacidad.");

  const db = await getRuntimeDb();
  const [product] = await db.select().from(products).where(eq(products.id, parsed.data.productId)).limit(1);
  if (!product) throw new Error("Producto no encontrado.");
  const [existing] = await db
    .select()
    .from(tryOnTextures)
    .where(eq(tryOnTextures.productId, product.id))
    .limit(1);

  const file = formData.get("texture");
  let textureUrl = existing?.textureUrl;
  let mediaAssetId = existing?.mediaAssetId;
  if (file instanceof File && file.size > 0) {
    if (!TEXTURE_TYPES.has(file.type) || file.size > MAX_TEXTURE_BYTES) {
      throw new Error("La textura debe ser PNG o WebP y pesar máximo 2 MB.");
    }
    const validated = validateMedia(new Uint8Array(await file.arrayBuffer()), file.type);
    if (validated.width && validated.height) {
      if (validated.width < 256 || validated.height < 256 || validated.width > 2048 || validated.height > 2048) {
        throw new Error("La textura debe medir entre 256 y 2048 px por lado.");
      }
      const ratio = validated.width / validated.height;
      if (ratio < 0.9 || ratio > 1.1) throw new Error("La textura debe ser cuadrada.");
    }
    const extension = file.type === "image/png" ? "png" : "webp";
    const stored = await (await getStorageProvider()).upload({
      key: `try-on/${product.slug}/${randomUUID()}.${extension}`,
      body: validated.body,
      contentType: validated.contentType,
    });
    const [asset] = await db
      .insert(mediaAssets)
      .values({
        storageKey: stored.key,
        url: stored.url,
        contentType: stored.contentType,
        sizeBytes: stored.size,
        altText: `Textura del simulador para ${product.name}`,
        width: validated.width,
        height: validated.height,
        uploadedByUserId: session.user.id,
      })
      .returning();
    textureUrl = asset.url;
    mediaAssetId = asset.id;
  }
  if (!textureUrl) throw new Error("Selecciona una textura PNG o WebP.");

  const values = {
    mediaAssetId,
    textureUrl,
    baseSize: parsed.data.baseSize,
    opacity: parsed.data.opacity,
    blendMode: parsed.data.blendMode,
    scaleX: parsed.data.scaleX,
    scaleY: parsed.data.scaleY,
    offsetX: parsed.data.offsetX,
    offsetY: parsed.data.offsetY,
    rotationOffset: parsed.data.rotationOffset,
    perspectiveStrength: parsed.data.perspectiveStrength,
    colorCorrection: {
      tint: parsed.data.tint.toLowerCase(),
      saturation: parsed.data.saturation,
      brightness: parsed.data.brightness,
    },
    reviewStatus: parsed.data.reviewStatus,
    updatedAt: new Date(),
  };

  const [saved] = existing
    ? await db.update(tryOnTextures).set(values).where(eq(tryOnTextures.id, existing.id)).returning()
    : await db.insert(tryOnTextures).values({ productId: product.id, ...values }).returning();

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: existing ? "try_on_texture.update" : "try_on_texture.create",
    entityType: "try_on_texture",
    entityId: saved.id,
    before: existing
      ? { reviewStatus: existing.reviewStatus, textureUrl: existing.textureUrl }
      : null,
    after: { reviewStatus: saved.reviewStatus, productId: product.id, textureUrl: saved.textureUrl },
  });
  revalidatePath("/admin/simulador");
  revalidatePath(`/productos/${product.slug}`);
}

export async function deleteTryOnTextureAction(formData: FormData) {
  const session = await requirePermission("catalog", "delete");
  const id = z.string().min(1).parse(formData.get("id"));
  const db = await getRuntimeDb();
  const [texture] = await db.select().from(tryOnTextures).where(eq(tryOnTextures.id, id)).limit(1);
  if (!texture) return;
  const [product] = await db.select().from(products).where(eq(products.id, texture.productId)).limit(1);
  const [asset] = texture.mediaAssetId
    ? await db.select().from(mediaAssets).where(eq(mediaAssets.id, texture.mediaAssetId)).limit(1)
    : [];

  await db.delete(tryOnTextures).where(eq(tryOnTextures.id, id));
  if (asset) {
    await (await getStorageProvider()).delete(asset.storageKey);
    await db.delete(mediaAssets).where(eq(mediaAssets.id, asset.id));
  }
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "try_on_texture.delete",
    entityType: "try_on_texture",
    entityId: id,
    before: { productId: texture.productId, textureUrl: texture.textureUrl },
  });
  revalidatePath("/admin/simulador");
  if (product) revalidatePath(`/productos/${product.slug}`);
}
