"use client";

import { useActionState } from "react";
import { cn } from "@/lib/utils";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { createNeighborhoodsBulkAction } from "./zone-actions";

export function BulkNeighborhoodsForm({ cityId }: { cityId: string }) {
  const [state, action, pending] = useActionState(createNeighborhoodsBulkAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="cityId" value={cityId} />
      <label className="grid gap-1 text-sm font-medium">
        Pegar varios barrios (separados por coma o uno por línea)
        <textarea
          name="names"
          required
          className="min-h-20 rounded-md border border-border bg-surface p-3 text-sm font-normal"
          placeholder="El Poblado, Laureles, Belén"
        />
      </label>
      <button disabled={pending} className="h-10 w-fit rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Creando…" : "Crear barrios"}
      </button>
      {state.status !== "idle" ? (
        <p role={state.status === "error" ? "alert" : "status"} className={cn("text-sm", state.status === "error" ? "text-danger" : "text-success")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
