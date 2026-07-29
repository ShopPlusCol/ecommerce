"use server";

import { createHash, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { validateMedia } from "@/modules/media/validation";
import { getStorageProvider } from "@/infrastructure/storage";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { manualTransferProofs, mediaAssets, orders, payments } from "@/infrastructure/db/schema";

export async function uploadTransferProofAction(formData: FormData) {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const token = String(formData.get("lookupToken") ?? "");
  const file = formData.get("proof");
  if (!(file instanceof File)) throw new Error("Adjunta el comprobante.");
  const db = await getRuntimeDb();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [order] = await db.select().from(orders).where(and(eq(orders.orderNumber, orderNumber), eq(orders.lookupTokenHash, tokenHash))).limit(1);
  if (!order) throw new Error("Pedido o código privado inválido.");
  const [payment] = await db.select().from(payments).where(and(eq(payments.orderId, order.id), eq(payments.provider, "manual_transfer"))).limit(1);
  if (!payment) throw new Error("Este pedido no usa transferencia.");
  const media = validateMedia(new Uint8Array(await file.arrayBuffer()), file.type);
  const key = `transfer-proofs/${randomUUID()}.${file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1].replace("+xml", "")}`;
  const stored = await (await getStorageProvider()).upload({ key, body: media.body, contentType: media.contentType });
  const [asset] = await db.insert(mediaAssets).values({
    storageKey: stored.key, url: stored.url, contentType: stored.contentType,
    sizeBytes: stored.size, altText: `Comprobante ${order.orderNumber}`,
    width: media.width, height: media.height,
  }).returning();
  await db.insert(manualTransferProofs).values({ paymentId: payment.id, mediaAssetId: asset.id });
  await db.update(orders).set({ status: "payment_in_review", updatedAt: new Date() }).where(eq(orders.id, order.id));
}
