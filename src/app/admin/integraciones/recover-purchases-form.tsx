"use client";

import { useActionState } from "react";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { recoverPendingPurchasesAction } from "./actions";

/**
 * Recuperación manual de compras que no llegaron a Meta.
 *
 * Existe porque la arquitectura no tiene planificador: sin esto, recuperar
 * una compra pendiente tras una caída de Meta exigiría tocar código. Se
 * puede pulsar sin miedo — cada evento se reclama de forma atómica, así que
 * no duplica compras ni reenvía las ya entregadas.
 */
export function RecoverPurchasesForm() {
  const [state, action, pending] = useActionState(recoverPendingPurchasesAction, INITIAL_ADMIN_ACTION_STATE);

  return (
    <form action={action} className="mt-4 rounded-lg border border-border bg-surface-sunken/60 p-3">
      <p className="text-sm text-text-muted">
        Si Meta estuvo caído, las compras afectadas quedan guardadas y pendientes de reenvío. Este
        botón las reintenta. No duplica compras ya enviadas.
      </p>
      <button
        disabled={pending}
        className="mt-3 h-9 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Reintentando…" : "Reintentar compras pendientes"}
      </button>
      {state.status !== "idle" ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-2 text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
