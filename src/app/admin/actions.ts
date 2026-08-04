"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import {
  auditLogs,
  inventoryItems,
  inventoryMovements,
  orderStatusHistory,
  orders,
  manualTransferProofs,
  payments,
  inventoryReservations,
  adminUsers,
  sessions,
  products,
} from "@/infrastructure/db/schema";
import { ORDER_STATUSES } from "@/infrastructure/db/schema/orders";
import { directTransitionBlockedReason, type OrderStatus } from "@/domain/services/order-status";
import { restockOrderInventory } from "@/modules/inventory/reservations";
import { adminStatusLabel } from "@/modules/admin/status-labels";

const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sku: z.string().trim().min(2).max(50),
  price: z.coerce.number().int().nonnegative(),
  compareAtPrice: z.union([z.literal(""), z.coerce.number().int().nonnegative()]).transform((value) => value === "" ? null : value),
  status: z.enum(["draft", "active", "archived"]),
  shortDescription: z.string().trim().max(240),
});

export async function createProductAction(formData: FormData) {
  const session = await requirePermission("catalog", "create");
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Producto inválido; revisa slug, SKU y precios.");
  const db = await getRuntimeDb();
  const [product] = await db.insert(products).values({
    ...parsed.data,
    publishedAt: parsed.data.status === "active" ? new Date() : null,
  }).returning();
  await db.insert(inventoryItems).values({ productId: product.id });
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "product.create",
    entityType: "product",
    entityId: product.id,
    after: { sku: product.sku, price: product.price, status: product.status },
  });
  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
}

export async function updateProductStatusAction(formData: FormData) {
  const session = await requirePermission("catalog", "update");
  const id = z.string().min(1).parse(formData.get("id"));
  const status = z.enum(["draft", "active", "archived"]).parse(formData.get("status"));
  const updatedAt = new Date(z.string().datetime().parse(formData.get("updatedAt")));
  const db = await getRuntimeDb();
  const [before] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  const [updated] = await db.update(products).set({
    status,
    publishedAt: status === "active" ? before?.publishedAt ?? new Date() : before?.publishedAt,
    updatedAt: new Date(),
  }).where(and(eq(products.id, id), eq(products.updatedAt, updatedAt))).returning();
  if (!updated) throw new Error("Conflicto de edición: el producto cambió; recarga e intenta de nuevo.");
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "product.status.update",
    entityType: "product",
    entityId: id,
    before: { status: before?.status },
    after: { status },
  });
  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
}

export async function adjustInventoryAction(formData: FormData) {
  const session = await requirePermission("inventory", "update");
  const itemId = z.string().min(1).parse(formData.get("itemId"));
  const delta = z.coerce.number().int().parse(formData.get("delta"));
  const reason = z.string().trim().min(4).max(240).parse(formData.get("reason"));
  const db = await getRuntimeDb();
  const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId)).limit(1);
  if (!item || item.quantityOnHand + delta < item.quantityReserved) {
    throw new Error("El ajuste dejaría inventario negativo o por debajo de lo reservado.");
  }
  await db.update(inventoryItems).set({
    quantityOnHand: sql`${inventoryItems.quantityOnHand} + ${delta}`,
    updatedAt: new Date(),
  }).where(eq(inventoryItems.id, itemId));
  await db.insert(inventoryMovements).values({
    inventoryItemId: itemId,
    type: "manual_adjustment",
    quantityDelta: delta,
    reason,
    createdByUserId: session.user.id,
  });
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "inventory.adjust",
    entityType: "inventory_item",
    entityId: itemId,
    before: { quantityOnHand: item.quantityOnHand },
    after: { quantityOnHand: item.quantityOnHand + delta },
    reason,
  });
  revalidatePath("/admin/inventario");
  revalidatePath("/catalogo");
}

export async function changeOrderStatusAction(formData: FormData) {
  const session = await requirePermission("orders", "update");
  const id = z.string().min(1).parse(formData.get("id"));
  const toStatus = z.enum(ORDER_STATUSES).parse(formData.get("status"));
  // La nota es OPCIONAL: obligarla hacía que quien solo quería marcar
  // "Entregado" escribiera cualquier cosa, y el historial se llenaba de
  // texto sin valor. El historial ya registra estado anterior, nuevo, fecha
  // y usuario por su cuenta.
  const note = z.string().trim().max(500).optional().parse(formData.get("note") ?? undefined) || null;
  const db = await getRuntimeDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) throw new Error("Pedido no encontrado.");
  const blocked = directTransitionBlockedReason(order.status as OrderStatus, toStatus);
  if (blocked) throw new Error(blocked);
  await db.update(orders).set({ status: toStatus, updatedAt: new Date() }).where(eq(orders.id, id));
  await db.insert(orderStatusHistory).values({
    orderId: id,
    fromStatus: order.status,
    toStatus,
    changedByUserId: session.user.id,
    note,
  });
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "order.status.update",
    entityType: "order",
    entityId: id,
    before: { status: order.status },
    after: { status: toStatus },
    reason: note,
  });
  // La devolución al stock solo ocurre al ENTRAR en un estado que la
  // implica desde uno que no la tenía. `restockOrderInventory` es además
  // idempotente (reclama cada reserva antes de devolverla), así que un
  // segundo paso entre estados devueltos no puede duplicar inventario.
  const inventoryReturning: OrderStatus[] = ["cancelled", "returned"];
  const wasReturned = inventoryReturning.includes(order.status as OrderStatus) || order.status === "refunded";
  if (inventoryReturning.includes(toStatus) && !wasReturned) {
    await restockOrderInventory(id, `Pedido pasó a "${adminStatusLabel(toStatus)}"${note ? `: ${note}` : ""}`);
  }
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/inventario");
}

export async function reviewManualTransferAction(formData: FormData) {
  const session = await requirePermission("payments", "update");
  const proofId = z.string().min(1).parse(formData.get("proofId"));
  const decision = z.enum(["approved", "rejected"]).parse(formData.get("decision"));
  const reason = z.string().trim().max(300).parse(formData.get("reason"));
  if (decision === "rejected" && reason.length < 4) throw new Error("Indica el motivo del rechazo.");
  const db = await getRuntimeDb();
  const [row] = await db.select({ proof: manualTransferProofs, payment: payments })
    .from(manualTransferProofs)
    .innerJoin(payments, eq(payments.id, manualTransferProofs.paymentId))
    .where(eq(manualTransferProofs.id, proofId)).limit(1);
  if (!row || row.proof.status !== "pending") throw new Error("El comprobante ya fue revisado.");
  await db.update(manualTransferProofs).set({
    status: decision,
    reviewedByUserId: session.user.id,
    reviewedAt: new Date(),
    rejectionReason: decision === "rejected" ? reason : null,
    updatedAt: new Date(),
  }).where(eq(manualTransferProofs.id, proofId));
  await db.update(payments).set({
    status: decision,
    verifiedByUserId: session.user.id,
    verifiedAt: new Date(),
    rejectionReason: decision === "rejected" ? reason : null,
    updatedAt: new Date(),
  }).where(eq(payments.id, row.payment.id));
  if (decision === "approved") {
    const reservations = await db.select().from(inventoryReservations).where(eq(inventoryReservations.orderId, row.payment.orderId));
    for (const reservation of reservations.filter((item) => item.status === "active")) {
      await db.update(inventoryItems).set({
        quantityOnHand: sql`${inventoryItems.quantityOnHand} - ${reservation.quantity}`,
        quantityReserved: sql`max(0, ${inventoryItems.quantityReserved} - ${reservation.quantity})`,
        quantitySold: sql`${inventoryItems.quantitySold} + ${reservation.quantity}`,
        updatedAt: new Date(),
      }).where(eq(inventoryItems.id, reservation.inventoryItemId));
      await db.update(inventoryReservations).set({ status: "consumed", updatedAt: new Date() }).where(eq(inventoryReservations.id, reservation.id));
      await db.insert(inventoryMovements).values({
        inventoryItemId: reservation.inventoryItemId,
        type: "sale",
        quantityDelta: -reservation.quantity,
        referenceOrderId: row.payment.orderId,
        reason: "Transferencia aprobada manualmente",
        createdByUserId: session.user.id,
      });
    }
    await db.update(orders).set({
      status: "confirmed",
      paymentStatus: row.payment.purpose === "shipping_advance" ? "advance_approved" : "paid",
      amountPaid: row.payment.amount,
      updatedAt: new Date(),
    }).where(eq(orders.id, row.payment.orderId));
  } else {
    await db.update(orders).set({ paymentStatus: "rejected", status: "pending_payment", updatedAt: new Date() }).where(eq(orders.id, row.payment.orderId));
  }
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: `manual_transfer.${decision}`,
    entityType: "payment",
    entityId: row.payment.id,
    before: { status: row.payment.status },
    after: { status: decision },
    reason,
  });
  revalidatePath("/admin/pagos");
  revalidatePath("/admin/pedidos");
}

export async function manageAdminUserAction(formData: FormData) {
  const session = await requirePermission("users", "update");
  const userId = z.string().min(1).parse(formData.get("userId"));
  const operation = z.enum(["revoke_sessions", "activate", "suspend"]).parse(formData.get("operation"));
  if (userId === session.user.id && operation === "suspend") throw new Error("No puedes suspender tu propia cuenta.");
  const db = await getRuntimeDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
  if (!user) throw new Error("Usuario no encontrado.");
  if (operation === "revoke_sessions") await db.delete(sessions).where(eq(sessions.userId, userId));
  else await db.update(adminUsers).set({ status: operation === "activate" ? "active" : "suspended", updatedAt: new Date() }).where(eq(adminUsers.id, userId));
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: `admin_user.${operation}`,
    entityType: "admin_user",
    entityId: userId,
    before: { status: user.status },
    after: { status: operation === "activate" ? "active" : operation === "suspend" ? "suspended" : user.status },
  });
  revalidatePath("/admin/usuarios");
}
