"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState } from "react";
import { cn } from "@/lib/utils";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { deleteZoneAction } from "./zone-actions";

function Pill({ label, tone }: { label: string; tone: "success" | "danger" | "warning" | "neutral" | "brand" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tone === "success" && "bg-success-soft text-success",
        tone === "danger" && "bg-danger-soft text-danger",
        tone === "warning" && "bg-warning-soft text-warning",
        tone === "neutral" && "bg-surface-sunken text-text-muted",
        tone === "brand" && "bg-brand-soft text-brand",
      )}
    >
      {label}
    </span>
  );
}

export type ZoneCardProps = {
  id: string;
  name: string;
  status: "active" | "inactive";
  effectivelyActive: boolean;
  feeLabel: string;
  feeOwn: boolean;
  coverageBlocked: boolean;
  coverageOwn: boolean;
  cashOnDeliveryAllowed: boolean;
  cashOwn: boolean;
  sameDayAvailable: boolean;
  sameDayOwn: boolean;
  childCount: number;
  childLabel: string;
  drillHref?: string;
  deleteWarning: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function ZoneCard({
  id,
  name,
  status,
  effectivelyActive,
  feeLabel,
  feeOwn,
  coverageBlocked,
  coverageOwn,
  cashOnDeliveryAllowed,
  cashOwn,
  sameDayAvailable,
  sameDayOwn,
  childCount,
  childLabel,
  drillHref,
  deleteWarning,
  children,
  defaultOpen = false,
}: ZoneCardProps) {
  const [state, action, pending] = useActionState(deleteZoneAction, INITIAL_ADMIN_ACTION_STATE);

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{name}</h3>
            <Pill label={status === "active" ? "Activa" : "Inactiva"} tone={status === "active" ? "success" : "neutral"} />
            {status === "active" && !effectivelyActive ? <Pill label="Bloqueada: ancestro inactivo" tone="warning" /> : null}
            {coverageBlocked ? <Pill label="Sin cobertura" tone="danger" /> : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
            <span>
              {feeLabel}
              {feeLabel !== "Sin tarifa configurada" ? <span className="ml-1 text-text-muted/70">({feeOwn ? "propia" : "heredada"})</span> : null}
            </span>
            <span>Contraentrega: {cashOnDeliveryAllowed ? "sí" : "no"}{cashOwn ? "" : " (heredado)"}</span>
            <span>Mismo día: {sameDayAvailable ? "sí" : "no"}{sameDayOwn ? "" : " (heredado)"}</span>
            {!coverageOwn ? <span className="text-text-muted/70">Cobertura heredada</span> : null}
          </div>
        </div>
        {drillHref ? (
          <Link href={drillHref} className="whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-text transition hover:border-brand hover:text-brand">
            Ver {childLabel} ({childCount}) ›
          </Link>
        ) : null}
      </div>

      <details className="mt-3" open={defaultOpen}>
        <summary className="cursor-pointer text-sm font-semibold text-brand">Configurar</summary>
        <div className="mt-3 border-t border-border pt-3">{children}</div>
      </details>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
        <form
          action={action}
          onSubmit={(event) => {
            if (!window.confirm(`¿Eliminar "${name}"?${deleteWarning}`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="zoneId" value={id} />
          <button type="submit" disabled={pending} className="text-xs font-semibold text-danger disabled:opacity-60">
            {pending ? "Eliminando…" : "Eliminar zona"}
          </button>
        </form>
        {state.status !== "idle" ? (
          <p role={state.status === "error" ? "alert" : "status"} className={cn("text-xs", state.status === "error" ? "text-danger" : "text-success")}>
            {state.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ZoneEmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong p-8 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-text-muted">{hint}</p>
    </div>
  );
}
