import { eq } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { adminUsers, roles, userRoles } from "@/infrastructure/db/schema";
import { manageAdminUserAction } from "../actions";
export default async function Page() {
  await requirePermission("users", "read"); const db = await getRuntimeDb();
  const rows = await db.select({ user: adminUsers, role: roles }).from(userRoles).innerJoin(adminUsers, eq(adminUsers.id, userRoles.userId)).innerJoin(roles, eq(roles.id, userRoles.roleId));
  return <><AdminPageHeader title="Usuarios y roles" description="Cinco perfiles con permisos por recurso y acción." />
    <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Sesiones</th></tr></thead>
      <tbody>{rows.map(({ user, role }) => <tr key={`${user.id}-${role.id}`} className="border-b"><td className="p-3">{user.fullName}</td><td>{user.email}</td><td>{role.name}</td><td>{user.status}</td><td><form action={manageAdminUserAction} className="flex gap-2 p-2"><input type="hidden" name="userId" value={user.id} /><button name="operation" value="revoke_sessions" className="rounded border px-2">Revocar sesiones</button><button name="operation" value={user.status === "active" ? "suspend" : "activate"} className="rounded border px-2">{user.status === "active" ? "Suspender" : "Activar"}</button></form></td></tr>)}</tbody>
    </table></div></>;
}
