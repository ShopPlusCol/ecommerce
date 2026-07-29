"use client";

import { useActionState } from "react";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { updateCustomerAction } from "./actions";

export function CustomerEditor({ customer }: { customer: { id: string; fullName: string; phone: string; email: string | null; tags: string[] | null; internalNotes: string | null; blockedAt: string | null; blockedReason: string | null } }) {
  const [state, action, pending] = useActionState(updateCustomerAction, INITIAL_ADMIN_ACTION_STATE);
  const input = "h-10 rounded-md border border-border px-3 text-sm";
  return (
    <form action={action} className="grid gap-4 rounded-xl border border-border bg-surface-raised p-5 md:grid-cols-2">
      <input type="hidden" name="id" value={customer.id} />
      <label className="grid gap-1 text-sm font-medium">Nombre<input className={input} name="fullName" required defaultValue={customer.fullName} /></label>
      <label className="grid gap-1 text-sm font-medium">Teléfono<input className={input} name="phone" required defaultValue={customer.phone} /></label>
      <label className="grid gap-1 text-sm font-medium">Correo<input className={input} name="email" type="email" defaultValue={customer.email ?? ""} /></label>
      <label className="grid gap-1 text-sm font-medium">Etiquetas<input className={input} name="tags" defaultValue={customer.tags?.join(", ") ?? ""} /></label>
      <label className="grid gap-1 text-sm font-medium md:col-span-2">Notas internas<textarea className="min-h-28 rounded-md border p-3" name="internalNotes" defaultValue={customer.internalNotes ?? ""} /></label>
      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="blocked" defaultChecked={Boolean(customer.blockedAt)} />Bloquear nuevas compras</label>
      <label className="grid gap-1 text-sm font-medium">Motivo de bloqueo<input className={input} name="blockedReason" defaultValue={customer.blockedReason ?? ""} /></label>
      <button disabled={pending} className="h-11 rounded-md bg-brand font-semibold text-white md:col-span-2">{pending ? "Guardando…" : "Guardar cliente"}</button>
      {state.status !== "idle" ? <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-danger md:col-span-2" : "text-success md:col-span-2"}>{state.message}</p> : null}
    </form>
  );
}
