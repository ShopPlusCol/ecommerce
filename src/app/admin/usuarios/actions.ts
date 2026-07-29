"use server";

import { and, eq, ne } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { adminUsers, auditLogs, authAccounts, roles, sessions, userRoles } from "@/infrastructure/db/schema";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { requirePermission } from "@/modules/auth/session";

async function activeOwnerCount(excludeUserId?: string) {
  const db = await getRuntimeDb();
  const rows = await db.select({ userId: adminUsers.id }).from(userRoles)
    .innerJoin(adminUsers, eq(adminUsers.id, userRoles.userId))
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(and(eq(roles.slug, "owner"), eq(adminUsers.status, "active"), excludeUserId ? ne(adminUsers.id, excludeUserId) : undefined));
  return new Set(rows.map((row) => row.userId)).size;
}

export async function createAdminUserAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("users", "create");
    const data = z.object({
      fullName: z.string().trim().min(2).max(120),
      email: z.string().trim().toLowerCase().email(),
      roleId: z.string().min(1),
      password: z.string().min(12).max(128),
    }).parse(Object.fromEntries(formData));
    const db = await getRuntimeDb();
    const [role] = await db.select().from(roles).where(eq(roles.id, data.roleId)).limit(1);
    if (!role) throw new Error("El rol seleccionado ya no existe.");
    const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, data.email)).limit(1);
    if (existing) throw new Error("Ya existe una cuenta con ese correo.");
    const passwordHash = await hashPassword(data.password);
    const [user] = await db.insert(adminUsers).values({ fullName: data.fullName, email: data.email, passwordHash, emailVerified: true }).returning();
    await db.insert(authAccounts).values({ accountId: user.id, providerId: "credential", userId: user.id, password: passwordHash });
    await db.insert(userRoles).values({ userId: user.id, roleId: role.id });
    await db.insert(auditLogs).values({ userId: session.user.id, action: "admin_user.create", entityType: "admin_user", entityId: user.id, after: { email: user.email, role: role.slug, status: user.status } });
    revalidatePath("/admin/usuarios");
    return { status: "success", message: "Usuario creado. La contraseña no se almacena ni se vuelve a mostrar en pantalla." };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateAdminUserAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("users", "update");
    const userId = z.string().min(1).parse(formData.get("userId"));
    const operation = z.enum(["role", "activate", "suspend", "revoke_sessions", "password"]).parse(formData.get("operation"));
    const db = await getRuntimeDb();
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
    if (!user) throw new Error("El usuario ya no existe.");
    const currentRoles = await db.select({ id: roles.id, slug: roles.slug }).from(userRoles).innerJoin(roles, eq(roles.id, userRoles.roleId)).where(eq(userRoles.userId, userId));
    const isOwner = currentRoles.some((role) => role.slug === "owner");
    if ((operation === "suspend" || operation === "role") && isOwner && await activeOwnerCount(userId) === 0) throw new Error("No puedes suspender ni retirar el rol al último propietario activo.");
    if (operation === "suspend" && userId === session.user.id) throw new Error("No puedes suspender tu propia cuenta.");
    let after: Record<string, unknown> = {};
    if (operation === "role") {
      const roleId = z.string().min(1).parse(formData.get("roleId"));
      const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
      if (!role) throw new Error("El rol seleccionado no existe.");
      await db.delete(userRoles).where(eq(userRoles.userId, userId));
      await db.insert(userRoles).values({ userId, roleId });
      after = { role: role.slug };
    } else if (operation === "revoke_sessions") {
      await db.delete(sessions).where(eq(sessions.userId, userId));
      after = { sessionsRevoked: true };
    } else if (operation === "password") {
      const password = z.string().min(12).max(128).parse(formData.get("password"));
      const passwordHash = await hashPassword(password);
      await db.update(adminUsers).set({ passwordHash, updatedAt: new Date() }).where(eq(adminUsers.id, userId));
      await db.update(authAccounts).set({ password: passwordHash, updatedAt: new Date() }).where(and(eq(authAccounts.userId, userId), eq(authAccounts.providerId, "credential")));
      await db.delete(sessions).where(eq(sessions.userId, userId));
      after = { passwordChanged: true, sessionsRevoked: true };
    } else {
      const status = operation === "activate" ? "active" : "suspended";
      await db.update(adminUsers).set({ status, updatedAt: new Date() }).where(eq(adminUsers.id, userId));
      if (status === "suspended") await db.delete(sessions).where(eq(sessions.userId, userId));
      after = { status };
    }
    await db.insert(auditLogs).values({ userId: session.user.id, action: `admin_user.${operation}`, entityType: "admin_user", entityId: userId, before: { status: user.status, roles: currentRoles.map((role) => role.slug) }, after });
    revalidatePath("/admin/usuarios");
    return { status: "success", message: operation === "role" ? "Rol actualizado." : operation === "password" ? "Contraseña cambiada y sesiones revocadas." : operation === "revoke_sessions" ? "Sesiones revocadas." : "Estado actualizado." };
  } catch (error) {
    return actionError(error);
  }
}
