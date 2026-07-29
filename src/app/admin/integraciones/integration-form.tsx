"use client";

import { useActionState } from "react";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { updateIntegrationAction } from "./actions";

export function IntegrationForm({ provider, enabled, testMode }: { provider: string; enabled: boolean; testMode: boolean }) {
  const [state, action, pending] = useActionState(updateIntegrationAction, INITIAL_ADMIN_ACTION_STATE);
  return <form action={action} className="mt-4 grid gap-3"><input type="hidden" name="provider" value={provider} /><div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="isEnabled" defaultChecked={enabled} />Integración activa</label><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="isTestMode" defaultChecked={testMode} />Modo de prueba</label></div><div className="flex flex-wrap gap-2"><button name="operation" value="save" disabled={pending} className="h-9 rounded-md bg-brand px-4 text-sm font-semibold text-white">Guardar estado</button><button name="operation" value="diagnose" disabled={pending} className="h-9 rounded-md border border-border px-4 text-sm font-semibold">Diagnóstico local seguro</button></div>{state.status !== "idle" ? <p role={state.status === "error" ? "alert" : "status"} className={`text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>{state.message}</p> : null}</form>;
}
