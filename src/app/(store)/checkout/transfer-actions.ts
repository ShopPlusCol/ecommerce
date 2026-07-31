"use server";

import { createHash, randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import {
  MAX_TRANSFER_PROOF_BYTES,
  validateTransferProof,
} from "@/modules/media/transfer-proof";
import type { UploadResult } from "@/application/ports/storage-provider";
import { getStorageProvider } from "@/infrastructure/storage";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { manualTransferProofs, mediaAssets, orders, payments } from "@/infrastructure/db/schema";
import { enforceRateLimit, RateLimitError } from "@/modules/security/rate-limit";

export type UploadTransferProofState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function uploadTransferProofAction(
  _state: UploadTransferProofState,
  formData: FormData,
): Promise<UploadTransferProofState> {
  try {
    await enforceRateLimit("transfer_proof", 5, 10 * 60);
  } catch (error) {
    if (error instanceof RateLimitError) return { status: "error", message: error.message };
    throw error;
  }
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const token = String(formData.get("lookupToken") ?? "");
  const file = formData.get("proof");
  if (!orderNumber || token.length < 20) {
    return { status: "error", message: "Pedido o código privado inválido." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Adjunta el comprobante." };
  }
  if (file.size > MAX_TRANSFER_PROOF_BYTES) {
    return { status: "error", message: "El comprobante no puede superar 8 MB." };
  }

  let storage: Awaited<ReturnType<typeof getStorageProvider>> | null = null;
  let stored: UploadResult | null = null;
  try {
    const db = await getRuntimeDb();
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.orderNumber, orderNumber), eq(orders.lookupTokenHash, tokenHash)))
      .limit(1);
    if (!order) return { status: "error", message: "Pedido o código privado inválido." };

    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.orderId, order.id), eq(payments.provider, "manual_transfer")))
      .limit(1);
    if (!payment) return { status: "error", message: "Este pedido no usa transferencia." };

    const [existingProof] = await db
      .select({ id: manualTransferProofs.id })
      .from(manualTransferProofs)
      .where(and(
        eq(manualTransferProofs.paymentId, payment.id),
        inArray(manualTransferProofs.status, ["pending", "approved"]),
      ))
      .limit(1);
    if (existingProof) {
      return { status: "success", message: "Ya recibimos un comprobante para este pedido." };
    }

    let media;
    try {
      media = validateTransferProof(new Uint8Array(await file.arrayBuffer()), file.type);
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "El comprobante no es una imagen válida.",
      };
    }

    storage = await getStorageProvider();
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const key = `transfer-proofs/${randomUUID()}.${extension}`;
    stored = await storage.upload({ key, body: media.body, contentType: media.contentType });
    const [asset] = await db.insert(mediaAssets).values({
      storageKey: stored.key,
      url: stored.url,
      contentType: stored.contentType,
      sizeBytes: stored.size,
      altText: `Comprobante ${order.orderNumber}`,
      width: media.width,
      height: media.height,
    }).returning();
    await db.insert(manualTransferProofs).values({ paymentId: payment.id, mediaAssetId: asset.id });
    await db
      .update(orders)
      .set({ status: "payment_in_review", updatedAt: new Date() })
      .where(eq(orders.id, order.id));
    return { status: "success", message: "Comprobante enviado. Lo revisaremos antes de aprobar el pago." };
  } catch (error) {
    if (stored && storage) {
      try {
        await storage.delete(stored.key);
      } catch (cleanupError) {
        console.error("No se pudo limpiar el comprobante huérfano.", cleanupError);
      }
    }
    console.error("No se pudo guardar el comprobante de transferencia.", error);
    return {
      status: "error",
      message: "No pudimos guardar el comprobante. Inténtalo nuevamente.",
    };
  }
}
