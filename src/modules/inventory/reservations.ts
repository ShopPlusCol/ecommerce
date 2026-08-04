import { and, eq, lte, sql } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { inventoryItems, inventoryMovements, inventoryReservations } from "@/infrastructure/db/schema";

/**
 * Repone el inventario de un pedido al cancelarse/devolverse (sección 19.4):
 * reservas "active" (nunca llegaron a venderse) se liberan del pool
 * reservado; reservas "consumed" (ya contadas como venta, p. ej. un pedido
 * entregado que se devuelve) regresan a stock disponible. Se llama una sola
 * vez, justo al entrar a "cancelled"/"returned" — la máquina de estados no
 * permite reentrar a esos estados, así que no hay riesgo de reponer dos veces.
 */
export async function restockOrderInventory(orderId: string, reason: string, now = new Date()) {
  const db = await getRuntimeDb();
  const reservations = await db.select().from(inventoryReservations).where(eq(inventoryReservations.orderId, orderId));
  for (const reservation of reservations) {
    if (reservation.status === "active") {
      const [claimed] = await db.update(inventoryReservations).set({
        status: "released",
        updatedAt: now,
      }).where(and(
        eq(inventoryReservations.id, reservation.id),
        eq(inventoryReservations.status, "active"),
      )).returning({ id: inventoryReservations.id });
      if (!claimed) continue;
      await db.update(inventoryItems).set({
        quantityReserved: sql`max(0, ${inventoryItems.quantityReserved} - ${reservation.quantity})`,
        updatedAt: now,
      }).where(eq(inventoryItems.id, reservation.inventoryItemId));
      await db.insert(inventoryMovements).values({
        inventoryItemId: reservation.inventoryItemId,
        type: "release",
        quantityDelta: -reservation.quantity,
        referenceOrderId: orderId,
        reason,
      });
    } else if (reservation.status === "consumed") {
      await db.update(inventoryItems).set({
        quantityOnHand: sql`${inventoryItems.quantityOnHand} + ${reservation.quantity}`,
        quantitySold: sql`max(0, ${inventoryItems.quantitySold} - ${reservation.quantity})`,
        updatedAt: now,
      }).where(eq(inventoryItems.id, reservation.inventoryItemId));
      await db.insert(inventoryMovements).values({
        inventoryItemId: reservation.inventoryItemId,
        type: "return",
        quantityDelta: reservation.quantity,
        referenceOrderId: orderId,
        reason,
      });
    }
  }
}

/** Libera reservas expiradas de forma idempotente antes de cotizar/crear. */
export async function releaseExpiredReservations(now = new Date()) {
  const db = await getRuntimeDb();
  const expired = await db.select().from(inventoryReservations).where(and(
    eq(inventoryReservations.status, "active"),
    lte(inventoryReservations.expiresAt, now),
  ));
  for (const reservation of expired) {
    const [claimed] = await db.update(inventoryReservations).set({
      status: "released",
      updatedAt: now,
    }).where(and(
      eq(inventoryReservations.id, reservation.id),
      eq(inventoryReservations.status, "active"),
    )).returning({ id: inventoryReservations.id });
    if (!claimed) continue;
    await db.update(inventoryItems).set({
      quantityReserved: sql`max(0, ${inventoryItems.quantityReserved} - ${reservation.quantity})`,
      updatedAt: now,
    }).where(eq(inventoryItems.id, reservation.inventoryItemId));
    await db.insert(inventoryMovements).values({
      inventoryItemId: reservation.inventoryItemId,
      type: "release",
      quantityDelta: -reservation.quantity,
      referenceOrderId: reservation.orderId,
      reason: "Reserva de checkout expirada",
    });
  }
  return expired.length;
}
