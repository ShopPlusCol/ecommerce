"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, customers } from "@/infrastructure/db/schema";

export async function updateCustomerAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("customers", "update");
    const id = z.string().min(1).parse(formData.get("id"));
    const fullName = z.string().trim().min(2).max(120).parse(formData.get("fullName"));
    const phone = z.string().trim().min(7).max(30).parse(formData.get("phone"));
    const emailRaw = String(formData.get("email") ?? "").trim();
    const email = emailRaw ? z.string().email().parse(emailRaw) : null;
    const tags = String(formData.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean);
    const internalNotes = z.string().trim().max(2_000).parse(formData.get("internalNotes") ?? "");
    const blocked = formData.get("blocked") === "on";
    const blockedReason = String(formData.get("blockedReason") ?? "").trim();
    if (blocked && blockedReason.length < 5) return { status: "error", message: "Indica el motivo del bloqueo." };
    const db = await getRuntimeDb();
    const [before] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (!before) return { status: "error", message: "El cliente ya no existe." };
    const values = { fullName, phone, email, tags, internalNotes: internalNotes || null, blockedAt: blocked ? before.blockedAt ?? new Date() : null, blockedReason: blocked ? blockedReason : null, updatedAt: new Date() };
    await db.update(customers).set(values).where(eq(customers.id, id));
    await db.insert(auditLogs).values({ userId: session.user.id, action: "customer.update", entityType: "customer", entityId: id, before: { phone: before.phone, email: before.email, blockedAt: before.blockedAt }, after: { phone, email, tags, blocked: Boolean(values.blockedAt) }, reason: blocked ? blockedReason : null });
    revalidatePath("/admin/clientes");
    revalidatePath(`/admin/clientes/${id}`);
    return { status: "success", message: "Perfil interno del cliente actualizado." };
  } catch (error) {
    return actionError(error);
  }
}
