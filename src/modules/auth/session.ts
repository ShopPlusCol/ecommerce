import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getAuth } from "./auth";
import { can, type Permission } from "./authorization";
import { getRuntimeDb } from "@/infrastructure/db/client";
import {
  adminUsers,
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from "@/infrastructure/db/schema";

export type AdminSession = {
  user: { id: string; name: string; email: string };
  roles: string[];
  permissions: Permission[];
};

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const db = await getRuntimeDb();
  const [user] = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.fullName,
      email: adminUsers.email,
      status: adminUsers.status,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, session.user.id))
    .limit(1);
  if (!user || user.status !== "active") return null;

  const grants = await db
    .select({
      role: roles.slug,
      resource: permissions.resource,
      action: permissions.action,
    })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .leftJoin(
      permissions,
      and(eq(permissions.id, rolePermissions.permissionId)),
    )
    .where(eq(userRoles.userId, user.id));

  return {
    user: { id: user.id, name: user.name, email: user.email },
    roles: [...new Set(grants.map((grant) => grant.role))],
    permissions: grants
      .filter((grant) => grant.resource && grant.action)
      .map((grant) => `${grant.resource}:${grant.action}` as Permission),
  };
});

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) redirect("/acceso-admin");
  return session;
}

export async function requirePermission(resource: string, action: string) {
  const session = await requireAdminSession();
  if (!can(session.roles, session.permissions, resource, action)) {
    throw new Error("No tienes permisos para realizar esta acción.");
  }
  return session;
}
