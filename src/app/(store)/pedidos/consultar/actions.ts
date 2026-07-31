"use server";

import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { orders } from "@/infrastructure/db/schema";
import { enforceRateLimit, RateLimitError } from "@/modules/security/rate-limit";

export type LookupState = { error?: string; order?: { orderNumber: string; status: string; paymentStatus: string; shippingCity: string | null; total: number; updatedAt: string } };
export async function lookupOrderAction(_state: LookupState, formData: FormData): Promise<LookupState> {
  try {
    await enforceRateLimit("order_lookup", 10, 10 * 60);
  } catch (error) {
    if (error instanceof RateLimitError) return { error: error.message };
    throw error;
  }
  const parsed = z.object({
    orderNumber: z.string().trim().min(6).max(40),
    token: z.string().trim().min(20).max(100),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Datos de consulta inválidos." };
  const hash = createHash("sha256").update(parsed.data.token).digest("hex");
  const db = await getRuntimeDb();
  const [order] = await db.select().from(orders).where(and(
    eq(orders.orderNumber, parsed.data.orderNumber),
    eq(orders.lookupTokenHash, hash),
  )).limit(1);
  if (!order) return { error: "No encontramos un pedido con esos datos." };
  return { order: {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    shippingCity: order.shippingCity,
    total: order.total,
    updatedAt: order.updatedAt.toISOString(),
  } };
}
