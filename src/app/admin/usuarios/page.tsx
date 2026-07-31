import { asc, eq } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { adminUsers, permissions, rolePermissions, roles, sessions, userRoles } from "@/infrastructure/db/schema";
import { CreateUserForm, UserControls } from "./user-forms";

export default async function Page() {
  await requirePermission("users", "read");
  const db = await getRuntimeDb();
  const [users, roleRows, assignments, grants, sessionRows] = await Promise.all([
    db.select().from(adminUsers).orderBy(asc(adminUsers.fullName)),
    db.select().from(roles).orderBy(asc(roles.name)),
    db.select().from(userRoles),
    db.select({ roleId: rolePermissions.roleId, resource: permissions.resource, action: permissions.action }).from(rolePermissions).innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId)),
    db.select({ userId: sessions.userId }).from(sessions),
  ]);
  const roleMap = new Map(roleRows.map((role) => [role.id, role]));
  return <><AdminPageHeader title="Usuarios y roles" description="Cuentas únicas con rol, permisos, acceso reciente y controles de seguridad. El último propietario activo está protegido." /><CreateUserForm roles={roleRows} /><section className="mt-6 grid gap-4">{users.map((user) => {
    const assigned = assignments.filter((item) => item.userId === user.id).map((item) => roleMap.get(item.roleId)).filter(Boolean);
    const primary = assigned[0] ?? roleRows[0];
    const permissionCount = new Set(assigned.flatMap((role) => grants.filter((grant) => grant.roleId === role?.id).map((grant) => `${grant.resource}:${grant.action}`))).size;
    const activeSessions = sessionRows.filter((row) => row.userId === user.id).length;
    return <article key={user.id} className="grid gap-4 rounded-xl border border-border bg-surface-raised p-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1fr)]"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{user.fullName}</h2><span className={`rounded-full px-2 py-1 text-xs font-semibold ${user.status === "active" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>{user.status === "active" ? "Activo" : "Suspendido"}</span></div><p className="mt-1 text-sm text-text-muted">{user.email}</p><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-text-muted">Rol</dt><dd className="font-semibold">{assigned.map((role) => role?.name).join(", ") || "Sin rol"}</dd></div><div><dt className="text-text-muted">Permisos</dt><dd className="font-semibold">{permissionCount}</dd></div><div><dt className="text-text-muted">Último acceso</dt><dd>{user.lastLoginAt?.toLocaleString("es-CO") ?? "Nunca"}</dd></div><div><dt className="text-text-muted">Sesiones</dt><dd>{activeSessions}</dd></div></dl></div>{primary ? <UserControls userId={user.id} status={user.status} roleId={primary.id} roles={roleRows} /> : null}</article>;
  })}</section></>;
}
