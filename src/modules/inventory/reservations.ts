import { and, eq, lte, sql } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { inventoryItems, inventoryMovements, inventoryReservations } from "@/infrastructure/db/schema";

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
