"use server";

import { revalidatePath } from "next/cache";
import { and, eq, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { validateInventoryAdjustment } from "@/modules/inventory/admin-inventory";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import {
  auditLogs,
  inventoryItems,
  inventoryMovements,
  inventoryReservations,
} from "@/infrastructure/db/schema";

const movementTypeSchema = z.enum(["restock", "manual_adjustment", "return"]);

export async function adjustInventoryAdminAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const session = await requirePermission("inventory", "update");
    const itemId = z.string().min(1).parse(formData.get("itemId"));
    const delta = z.coerce.number().int().parse(formData.get("delta"));
    const reason = z.string().trim().min(5).max(240).parse(formData.get("reason"));
    const type = movementTypeSchema.parse(formData.get("type"));
    if (type === "restock" && delta < 1) {
      return { status: "error", message: "Una entrada de mercancía debe sumar unidades." };
    }
    if (type === "return" && delta < 1) {
      return { status: "error", message: "Una devolución al inventario debe sumar unidades." };
    }
    const db = await getRuntimeDb();
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId)).limit(1);
    if (!item) return { status: "error", message: "El registro de inventario ya no existe." };
    const validation = validateInventoryAdjustment(item, delta);
    if (!validation.ok) return { status: "error", message: validation.message };

    const [updated] = await db
      .update(inventoryItems)
      .set({ quantityOnHand: validation.nextOnHand, updatedAt: new Date() })
      .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.updatedAt, item.updatedAt)))
      .returning();
    if (!updated) {
      return { status: "error", message: "El inventario cambió mientras editabas. Recarga e intenta nuevamente." };
    }
    const [movement] = await db
      .insert(inventoryMovements)
      .values({
        inventoryItemId: itemId,
        type,
        quantityDelta: delta,
        reason,
        createdByUserId: session.user.id,
      })
      .returning();
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "inventory.adjust",
      entityType: "inventory_item",
      entityId: itemId,
      before: {
        quantityOnHand: item.quantityOnHand,
        quantityReserved: item.quantityReserved,
      },
      after: {
        quantityOnHand: validation.nextOnHand,
        quantityReserved: item.quantityReserved,
        movementId: movement.id,
        type,
        delta,
      },
      reason,
    });
    revalidatePath("/admin/inventario");
    revalidatePath("/catalogo");
    revalidatePath("/", "layout");
    return {
      status: "success",
      message: `Inventario actualizado. Existencias físicas: ${validation.nextOnHand}.`,
    };
  } catch (error) {
    return actionError(error);
  }
}

async function releaseReservation(
  reservationId: string,
  userId: string,
  reason: string,
) {
  const db = await getRuntimeDb();
  const [reservation] = await db
    .select()
    .from(inventoryReservations)
    .where(eq(inventoryReservations.id, reservationId))
    .limit(1);
  if (!reservation) return { released: false, message: "La reserva ya no existe." };
  if (reservation.status !== "active") {
    return { released: false, message: "La reserva ya fue consumida o liberada." };
  }
  const [claimed] = await db
    .update(inventoryReservations)
    .set({ status: "released", updatedAt: new Date() })
    .where(
      and(
        eq(inventoryReservations.id, reservationId),
        eq(inventoryReservations.status, "active"),
      ),
    )
    .returning();
  if (!claimed) return { released: false, message: "Otra operación procesó la reserva." };
  await db
    .update(inventoryItems)
    .set({
      quantityReserved: sql`max(0, ${inventoryItems.quantityReserved} - ${reservation.quantity})`,
      updatedAt: new Date(),
    })
    .where(eq(inventoryItems.id, reservation.inventoryItemId));
  const [movement] = await db
    .insert(inventoryMovements)
    .values({
      inventoryItemId: reservation.inventoryItemId,
      type: "release",
      quantityDelta: -reservation.quantity,
      referenceOrderId: reservation.orderId,
      reason,
      createdByUserId: userId,
    })
    .returning();
  await db.insert(auditLogs).values({
    userId,
    action: "inventory.reservation.release",
    entityType: "inventory_reservation",
    entityId: reservation.id,
    before: { status: "active", quantity: reservation.quantity },
    after: { status: "released", movementId: movement.id },
    reason,
  });
  return { released: true, message: "Reserva liberada y disponibilidad actualizada." };
}

export async function releaseInventoryReservationAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const session = await requirePermission("inventory", "update");
    const reservationId = z.string().min(1).parse(formData.get("reservationId"));
    const reason = z.string().trim().min(5).max(240).parse(formData.get("reason"));
    const result = await releaseReservation(reservationId, session.user.id, reason);
    revalidatePath("/admin/inventario");
    revalidatePath("/catalogo");
    return {
      status: result.released ? "success" : "error",
      message: result.message,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function releaseExpiredInventoryReservationsAction(
  _state: AdminActionState,
  _formData: FormData,
): Promise<AdminActionState> {
  void _state;
  void _formData;
  try {
    const session = await requirePermission("inventory", "update");
    const db = await getRuntimeDb();
    const expired = await db
      .select({ id: inventoryReservations.id })
      .from(inventoryReservations)
      .where(
        and(
          eq(inventoryReservations.status, "active"),
          lte(inventoryReservations.expiresAt, new Date()),
        ),
      );
    let released = 0;
    for (const reservation of expired) {
      const result = await releaseReservation(
        reservation.id,
        session.user.id,
        "Liberación administrativa de reserva vencida",
      );
      if (result.released) released += 1;
    }
    revalidatePath("/admin/inventario");
    revalidatePath("/catalogo");
    return {
      status: "success",
      message: released
        ? `${released} reserva${released === 1 ? "" : "s"} vencida${released === 1 ? "" : "s"} liberada${released === 1 ? "" : "s"}.`
        : "No había reservas vencidas activas.",
    };
  } catch (error) {
    return actionError(error);
  }
}
