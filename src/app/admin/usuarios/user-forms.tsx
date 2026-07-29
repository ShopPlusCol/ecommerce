"use client";

import { useActionState } from "react";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { createAdminUserAction, updateAdminUserAction } from "./actions";

const input = "h-10 rounded-md border border-border bg-surface px-3 text-sm";
function Message({ state }: { state: typeof INITIAL_ADMIN_ACTION_STATE }) { return state.status === "idle" ? null : <p role={state.status === "error" ? "alert" : "status"} className={`text-xs ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p>; }

export function CreateUserForm({ roles }: { roles: Array<{ id: string; name: string }> }) {
  const [state, action, pending] = useActionState(createAdminUserAction, INITIAL_ADMIN_ACTION_STATE);
  return <form action={action} className="grid gap-3 rounded-xl border border-border bg-surface-raised p-5 md:grid-cols-2"><h2 className="text-lg font-semibold md:col-span-2">Crear o invitar usuario</h2><p className="text-sm text-text-muted md:col-span-2">Sin SMTP configurado no se envía invitación: define aquí una contraseña temporal y compártela por un canal seguro.</p><label className="grid gap-1 text-sm font-semibold">Nombre<input className={input} name="fullName" required /></label><label className="grid gap-1 text-sm font-semibold">Correo<input className={input} name="email" type="email" required /></label><label className="grid gap-1 text-sm font-semibold">Rol<select className={input} name="roleId">{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><label className="grid gap-1 text-sm font-semibold">Contraseña temporal<input className={input} name="password" type="password" minLength={12} required autoComplete="new-password" /></label><button disabled={pending} className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white md:w-fit">{pending ? "Creando…" : "Crear usuario"}</button><Message state={state} /></form>;
}

export function UserControls({ userId, status, roleId, roles }: { userId: string; status: string; roleId: string; roles: Array<{ id: string; name: string }> }) {
  const [state, action, pending] = useActionState(updateAdminUserAction, INITIAL_ADMIN_ACTION_STATE);
  const base = <input type="hidden" name="userId" value={userId} />;
  return <div className="grid gap-3"><form action={action} className="flex flex-wrap gap-2">{base}<input type="hidden" name="operation" value="role" /><select className={input} name="roleId" defaultValue={roleId}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><button disabled={pending} className="rounded-md border border-border px-3 text-sm font-semibold">Cambiar rol</button></form><div className="flex flex-wrap gap-2"><form action={action}>{base}<button name="operation" value="revoke_sessions" className="h-9 rounded-md border border-border px-3 text-sm">Revocar sesiones</button></form><form action={action}>{base}<button name="operation" value={status === "active" ? "suspend" : "activate"} className="h-9 rounded-md border border-border px-3 text-sm">{status === "active" ? "Suspender" : "Activar"}</button></form></div><form action={action} className="flex flex-wrap gap-2">{base}<input type="hidden" name="operation" value="password" /><input className={input} name="password" type="password" minLength={12} required placeholder="Nueva contraseña temporal" /><button className="rounded-md border border-border px-3 text-sm font-semibold">Cambiar contraseña</button></form><Message state={state} /></div>;
}
