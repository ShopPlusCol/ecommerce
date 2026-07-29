"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/session";
import { validateMedia } from "@/modules/media/validation";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { getStorageProvider } from "@/infrastructure/storage";
import { getRuntimeDb } from "@/infrastructure/db/client";
import {
  auditLogs,
  categories,
  manualTransferProofs,
  mediaAssets,
  pageSections,
  popups,
  productMedia,
  promotions,
  tryOnTextures,
} from "@/infrastructure/db/schema";

const altTextSchema = z.string().trim().max(180, "El texto alternativo admite máximo 180 caracteres.");

export type InlineMediaUploadResult =
  | { status: "success"; message: string; asset: { id: string; url: string; altText: string } }
  | { status: "error"; message: string };

async function mediaReferenceCount(id: string, url: string) {
  const db = await getRuntimeDb();
  const [productRows, categoryRows, promotionRows, popupRows, proofRows, textureRows, sectionRows] = await Promise.all([
    db.select({ id: productMedia.id }).from(productMedia).where(eq(productMedia.url, url)),
    db.select({ id: categories.id }).from(categories).where(eq(categories.imageUrl, url)),
    db.select({ id: promotions.id }).from(promotions).where(eq(promotions.bannerImageUrl, url)),
    db
      .select({ id: popups.id })
      .from(popups)
      .where(or(eq(popups.imageUrlDesktop, url), eq(popups.imageUrlMobile, url))),
    db.select({ id: manualTransferProofs.id }).from(manualTransferProofs).where(eq(manualTransferProofs.mediaAssetId, id)),
    db.select({ id: tryOnTextures.id }).from(tryOnTextures).where(eq(tryOnTextures.mediaAssetId, id)),
    db.select({ id: pageSections.id, config: pageSections.config }).from(pageSections),
  ]);
  const sectionReferences = sectionRows.filter((row) => JSON.stringify(row.config).includes(url)).length;
  return (
    productRows.length +
    categoryRows.length +
    promotionRows.length +
    popupRows.length +
    proofRows.length +
    textureRows.length +
    sectionReferences
  );
}

async function persistMediaFile(file: File, altText: string, userId: string) {
  let storedKey: string | null = null;
  let insertedAssetId: string | null = null;
  try {
    const validated = validateMedia(new Uint8Array(await file.arrayBuffer()), file.type);
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1].replace("+xml", "");
    const key = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${extension}`;
    const storage = await getStorageProvider();
    const stored = await storage.upload({
      key,
      body: validated.body,
      contentType: validated.contentType,
    });
    storedKey = stored.key;
    const db = await getRuntimeDb();
    const [asset] = await db
      .insert(mediaAssets)
      .values({
        storageKey: stored.key,
        url: stored.url,
        contentType: stored.contentType,
        sizeBytes: stored.size,
        altText,
        width: validated.width,
        height: validated.height,
        uploadedByUserId: userId,
      })
      .returning();
    insertedAssetId = asset.id;
    await db.insert(auditLogs).values({
      userId,
      action: "media.upload",
      entityType: "media_asset",
      entityId: asset.id,
      after: { contentType: asset.contentType, sizeBytes: asset.sizeBytes, altText: asset.altText },
    });
    return asset;
  } catch (error) {
    if (insertedAssetId) {
      try {
        await (await getRuntimeDb()).delete(mediaAssets).where(eq(mediaAssets.id, insertedAssetId));
      } catch {
        // La compensación de base de datos se intenta antes de retirar el objeto.
      }
    }
    if (storedKey) {
      try {
        await (await getStorageProvider()).delete(storedKey);
      } catch {
        // El error original se conserva; el objeto huérfano puede limpiarse desde mantenimiento.
      }
    }
    throw error;
  }
}

function parseMediaInput(formData: FormData) {
  const file = formData.get("file");
  const altText = altTextSchema.parse(formData.get("altText") ?? "");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona un archivo para cargar.");
  }
  return { file, altText };
}

export async function uploadMediaAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const session = await requirePermission("media", "create");
    const { file, altText } = parseMediaInput(formData);
    await persistMediaFile(file, altText, session.user.id);
    revalidatePath("/admin/medios");
    return { status: "success", message: "Archivo cargado y registrado correctamente." };
  } catch (error) {
    return actionError(error);
  }
}

export async function uploadMediaInlineAction(formData: FormData): Promise<InlineMediaUploadResult> {
  try {
    const session = await requirePermission("media", "create");
    const { file, altText } = parseMediaInput(formData);
    const asset = await persistMediaFile(file, altText, session.user.id);
    revalidatePath("/admin/medios");
    return {
      status: "success",
      message: "Imagen cargada y seleccionada.",
      asset: { id: asset.id, url: asset.url, altText: asset.altText ?? altText },
    };
  } catch (error) {
    const state = actionError(error);
    return { status: "error", message: state.message };
  }
}

export async function updateMediaAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const session = await requirePermission("media", "update");
    const id = z.string().min(1).parse(formData.get("id"));
    const altText = altTextSchema.parse(formData.get("altText") ?? "");
    const db = await getRuntimeDb();
    const [before] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
    if (!before) return { status: "error", message: "El archivo ya no existe." };
    await db.update(mediaAssets).set({ altText, updatedAt: new Date() }).where(eq(mediaAssets.id, id));
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "media.update",
      entityType: "media_asset",
      entityId: id,
      before: { altText: before.altText },
      after: { altText },
    });
    revalidatePath("/admin/medios");
    return { status: "success", message: "Metadatos actualizados." };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteMediaAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const session = await requirePermission("media", "delete");
    const id = z.string().min(1).parse(formData.get("id"));
    const reason = z.string().trim().min(5, "Explica el motivo del borrado.").max(300).parse(formData.get("reason"));
    const db = await getRuntimeDb();
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
    if (!asset) return { status: "error", message: "El archivo ya no existe." };
    const referenceCount = await mediaReferenceCount(asset.id, asset.url);
    if (referenceCount > 0) {
      return {
        status: "error",
        message: `No se puede borrar: el archivo tiene ${referenceCount} referencia${referenceCount === 1 ? "" : "s"} activa${referenceCount === 1 ? "" : "s"}.`,
      };
    }
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "media.delete",
      entityType: "media_asset",
      entityId: id,
      before: { storageKey: asset.storageKey, url: asset.url, altText: asset.altText },
      reason,
    });
    await (await getStorageProvider()).delete(asset.storageKey);
    revalidatePath("/admin/medios");
    return { status: "success", message: "Archivo eliminado del catálogo y del almacenamiento." };
  } catch (error) {
    return actionError(error);
  }
}
