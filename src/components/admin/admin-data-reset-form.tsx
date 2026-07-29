"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import type { AdminActionState } from "@/modules/admin/action-state";

type ResetAction = (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;

export function AdminDataResetForm({
  title,
  description,
  confirmation,
  action,
}: {
  title: string;
  description: string;
  confirmation: string;
  action: ResetAction;
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle", message: "" });
  const [typed, setTyped] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const enabled = typed === confirmation && acknowledged && !pending;

  return (
    <section className="mt-8 rounded-xl border border-danger/30 bg-danger/5 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
        <div>
          <h2 className="font-semibold text-danger">{title}</h2>
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        </div>
      </div>
      <form
        action={formAction}
        className="mt-4 grid max-w-2xl gap-3"
        onSubmit={(event) => {
          if (!window.confirm("Esta acción es irreversible sin un backup. ¿Deseas continuar?")) {
            event.preventDefault();
          }
        }}
      >
        <label className="grid gap-1 text-sm font-semibold">
          Escribe {confirmation} para confirmar
          <input
            name="confirmation"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            className="h-10 rounded-md border border-danger/30 bg-surface px-3 font-normal"
          />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            name="acknowledged"
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand"
          />
          Comprendo que estos datos solo podrán recuperarse desde un backup previo.
        </label>
        <button
          disabled={!enabled}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-danger px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-fit"
        >
          <Trash2 className="h-4 w-4" />
          {pending ? "Limpiando…" : title}
        </button>
        {state.status !== "idle" ? (
          <p role={state.status === "error" ? "alert" : "status"} className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p>
        ) : null}
      </form>
    </section>
  );
}
