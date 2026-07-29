"use client";

import { useActionState } from "react";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { deleteMediaAction, updateMediaAction, uploadMediaAction } from "./actions";

function ActionMessage({
  state,
}: {
  state: typeof INITIAL_ADMIN_ACTION_STATE;
}) {
  if (state.status === "idle") return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={state.status === "error" ? "text-sm text-danger" : "text-sm text-success"}
    >
      {state.message}
    </p>
  );
}

export function MediaUploadForm() {
  const [state, action, pending] = useActionState(uploadMediaAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="grid gap-3 rounded-lg border border-border bg-surface-raised p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <label className="grid gap-1 text-sm font-medium">
        Archivo
        <input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" required className="h-11 rounded-md border border-border bg-surface p-2 text-sm" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Texto alternativo
        <input name="altText" maxLength={180} placeholder="Describe lo visible en la imagen" className="h-11 rounded-md border border-border bg-surface px-3" />
      </label>
      <button disabled={pending} className="h-11 rounded-md bg-brand px-5 font-semibold text-white disabled:opacity-60">
        {pending ? "Cargando…" : "Cargar archivo"}
      </button>
      <div className="md:col-span-3"><ActionMessage state={state} /></div>
    </form>
  );
}

export function MediaEditForm({ id, altText }: { id: string; altText: string }) {
  const [state, action, pending] = useActionState(updateMediaAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="grid gap-1 text-xs font-semibold">
        Texto alternativo
        <input name="altText" defaultValue={altText} maxLength={180} className="h-9 rounded-md border border-border px-2 text-sm font-normal" />
      </label>
      <button disabled={pending} className="h-9 rounded-md border border-border px-3 text-sm font-semibold disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar metadatos"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function MediaDeleteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteMediaAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="mt-3 grid gap-2 border-t border-border pt-3">
      <input type="hidden" name="id" value={id} />
      <label className="grid gap-1 text-xs font-semibold">
        Motivo para eliminar
        <input name="reason" required minLength={5} maxLength={300} placeholder="Ej. archivo duplicado" className="h-9 rounded-md border border-border px-2 text-sm font-normal" />
      </label>
      <button disabled={pending} className="h-9 rounded-md border border-danger/30 text-sm font-semibold text-danger disabled:opacity-60">
        {pending ? "Eliminando…" : "Eliminar de forma segura"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}
