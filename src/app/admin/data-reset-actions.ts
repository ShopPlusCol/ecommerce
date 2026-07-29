"use server";

import { count, eq, inArray, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { validateResetConfirmation } from "@/modules/admin/data-reset";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import {
  auditLogs,
  consentRecords,
  customers,
  idempotencyKeys,
  inventoryItems,
  inventoryMovements,
  inventoryReservations,
  orders,
} from "@/infrastructure/db/schema";

function requireOwner(roles: string[]) {
  if (!roles.includes("owner")) {
    throw new Error("Solo el propietario puede limpiar todos los registros.");
  }
}

export async function clearOrdersAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const session = await requirePermission("orders", "delete");
    requireOwner(session.roles);
    validateResetConfirmation("orders", formData.get("confirmation"), formData.get("acknowledged"));
    const db = await getRuntimeDb();
    const [{ value: orderCount }] = await db.select({ value: count() }).from(orders);

    await db.update(inventoryItems).set({ quantityReserved: 0, updatedAt: new Date() });
    await db.delete(inventoryReservations);
    await db.delete(inventoryMovements).where(isNotNull(inventoryMovements.referenceOrderId));
    await db.delete(orders);
    await db.delete(idempotencyKeys).where(eq(idempotencyKeys.scope, "checkout"));
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "orders.reset",
      entityType: "orders",
      entityId: "all",
      before: { count: orderCount },
      after: { count: 0, reservationsReleased: true },
      reason: "Restablecimiento total confirmado por el propietario.",
    });
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/pedidos");
    revalidatePath("/admin/clientes");
    return { status: "success", message: `${orderCount} pedido(s) eliminados y reservas liberadas.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function clearCustomersAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const session = await requirePermission("customers", "delete");
    requireOwner(session.roles);
    validateResetConfirmation("customers", formData.get("confirmation"), formData.get("acknowledged"));
    const db = await getRuntimeDb();
    const [{ value: customerCount }] = await db.select({ value: count() }).from(customers);

    await db
      .delete(consentRecords)
      .where(inArray(consentRecords.subjectId, db.select({ id: customers.id }).from(customers)));
    await db.delete(customers);
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "customers.reset",
      entityType: "customers",
      entityId: "all",
      before: { count: customerCount },
      after: { count: 0 },
      reason: "Restablecimiento total confirmado por el propietario.",
    });
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/clientes");
    revalidatePath("/admin/pedidos");
    return { status: "success", message: `${customerCount} cliente(s) y sus datos asociados fueron eliminados.` };
  } catch (error) {
    return actionError(error);
  }
}
