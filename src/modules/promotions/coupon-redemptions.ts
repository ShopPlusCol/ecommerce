import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import type { Db } from "@/infrastructure/db/client";

export type ClaimCouponRedemptionInput = {
  couponId: string;
  orderId: string;
  customerId: string;
  discountAmount: number;
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number | null;
  firstOrderOnly: boolean;
};

/**
 * Reclama un canje de cupón de forma atómica (sección 13, concurrencia): un
 * único INSERT...SELECT...WHERE evaluado bajo el mismo bloqueo de escritura
 * que usa cualquier otro INSERT en SQLite/D1 — no hay ventana entre "contar"
 * y "escribir" en la que otra petición concurrente pueda colarse. Si algún
 * límite ya se alcanzó (evaluado con el estado real de la tabla en ese
 * instante, no con un conteo leído antes), el INSERT no inserta ninguna
 * fila y esta función devuelve `null`.
 *
 * `coupon_redemptions.order_id` es UNIQUE (migración 0019) y el propio WHERE
 * ya excluye pedidos que ya tienen un canje, así que un reintento con el
 * mismo pedido devuelve `null` sin duplicar el canje ni lanzar por
 * violación de restricción — la unicidad es una segunda red de seguridad,
 * no el mecanismo principal. El llamador es responsable de deshacer el
 * pedido si el reclamo falla.
 */
export async function claimCouponRedemption(db: Db, input: ClaimCouponRedemptionInput): Promise<{ id: string } | null> {
  const id = createId();
  const now = Date.now();
  const firstOrderOnlyFlag = input.firstOrderOnly ? 1 : 0;
  const result = await db.get<{ id: string }>(sql`
    INSERT INTO coupon_redemptions (id, coupon_id, order_id, customer_id, discount_amount, created_at)
    SELECT ${id}, ${input.couponId}, ${input.orderId}, ${input.customerId}, ${input.discountAmount}, ${now}
    WHERE
      NOT EXISTS (SELECT 1 FROM coupon_redemptions WHERE order_id = ${input.orderId})
      AND (
        ${input.usageLimitTotal} IS NULL
        OR (SELECT COUNT(*) FROM coupon_redemptions WHERE coupon_id = ${input.couponId}) < ${input.usageLimitTotal}
      )
      AND (
        ${input.usageLimitPerCustomer} IS NULL
        OR (SELECT COUNT(*) FROM coupon_redemptions WHERE coupon_id = ${input.couponId} AND customer_id = ${input.customerId}) < ${input.usageLimitPerCustomer}
      )
      AND (
        ${firstOrderOnlyFlag} = 0
        OR NOT EXISTS (SELECT 1 FROM orders WHERE customer_id = ${input.customerId} AND id != ${input.orderId})
      )
    RETURNING id;
  `);
  return result ?? null;
}
