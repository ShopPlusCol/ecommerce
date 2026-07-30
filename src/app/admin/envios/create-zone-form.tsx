"use client";

import { useActionState } from "react";
import { cn } from "@/lib/utils";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { createZoneAction } from "./zone-actions";

export function CreateZoneForm({
  level,
  parentZoneId,
  label,
  placeholder,
}: {
  level: "department" | "city" | "neighborhood";
  parentZoneId?: string;
  label: string;
  placeholder: string;
}) {
  const [state, action, pending] = useActionState(createZoneAction, INITIAL_ADMIN_ACTION_STATE);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="level" value={level} />
      {parentZoneId ? <input type="hidden" name="parentZoneId" value={parentZoneId} /> : null}
      <label className="grid min-w-48 flex-1 gap-1 text-sm font-medium">
        {label}
        <input name="name" required minLength={2} maxLength={80} placeholder={placeholder} className="h-10 rounded-md border border-border bg-surface px-3 text-sm font-normal" />
      </label>
      <button disabled={pending} className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Creando…" : "Agregar"}
      </button>
      {state.status !== "idle" ? (
        <p role={state.status === "error" ? "alert" : "status"} className={cn("w-full text-sm", state.status === "error" ? "text-danger" : "text-success")}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
