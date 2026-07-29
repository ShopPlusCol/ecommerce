"use server";

import { randomUUID } from "node:crypto";
import { requirePermission } from "@/modules/auth/session";
import { validateMedia } from "@/modules/media/validation";
import { getStorageProvider } from "@/infrastructure/storage";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, mediaAssets } from "@/infrastructure/db/schema";

export async function uploadMediaAction(formData: FormData) {
  const session = await requirePermission("media", "create");
  const file = formData.get("file");
  const altText = String(formData.get("altText") ?? "").trim();
  if (!(file instanceof File)) throw new Error("Selecciona un archivo.");
  const validated = validateMedia(new Uint8Array(await file.arrayBuffer()), file.type);
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1].replace("+xml", "");
  const key = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${extension}`;
  const stored = await (await getStorageProvider()).upload({
    key,
    body: validated.body,
    contentType: validated.contentType,
  });
  const db = await getRuntimeDb();
  const [asset] = await db.insert(mediaAssets).values({
    storageKey: stored.key,
    url: stored.url,
    contentType: stored.contentType,
    sizeBytes: stored.size,
    altText,
    width: validated.width,
    height: validated.height,
    uploadedByUserId: session.user.id,
  }).returning();
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "media.upload",
    entityType: "media_asset",
    entityId: asset.id,
    after: { contentType: asset.contentType, sizeBytes: asset.sizeBytes },
  });
  return { id: asset.id, url: asset.url };
}
