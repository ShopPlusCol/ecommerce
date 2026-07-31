"use client";

import { type ReactNode, useActionState, useState } from "react";
import { cn } from "@/lib/utils";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { updateZoneConfigAction } from "./zone-actions";

type FieldMeta<T> = { own: T | null; effective: T | null; inheritedFromName: string | null };

export const PAYMENT_METHOD_OPTIONS: Array<{ value: "mercado_pago" | "cash_on_delivery" | "shipping_advance_transfer" | "transfer_full"; label: string }> = [
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "cash_on_delivery", label: "Pago contraentrega" },
  { value: "shipping_advance_transfer", label: "Anticipo del envío + saldo al recibir" },
  { value: "transfer_full", label: "Transferencia total anticipada" },
];

export type ZoneConfigFormProps = {
  zoneId: string;
  name: string;
  status: "active" | "inactive";
  ancestorsActive: boolean;
  fee: FieldMeta<number>;
  freeShippingThreshold: FieldMeta<number>;
  coverage: FieldMeta<"available" | "unavailable">;
  cashOnDeliveryAllowed: FieldMeta<boolean>;
  requiresAdvancePayment: FieldMeta<boolean>;
  advancePercentage: FieldMeta<number>;
  sameDayAvailable: FieldMeta<boolean>;
  sameDayCutoffHour: FieldMeta<number>;
  estimatedBusinessDaysMin: FieldMeta<number>;
  estimatedBusinessDaysMax: FieldMeta<number>;
  allowedPaymentMethods: FieldMeta<Array<"mercado_pago" | "cash_on_delivery" | "shipping_advance_transfer" | "transfer_full">>;
  customerMessage: FieldMeta<string>;
};

function money(amount: number) {
  return amount.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function FieldShell({
  field,
  label,
  hasOwn,
  effectiveLabel,
  onModeChange,
  children,
}: {
  field: string;
  label: string;
  hasOwn: boolean;
  effectiveLabel: string;
  onModeChange?: (mode: "inherit" | "custom") => void;
  children: ReactNode;
}) {
  const [mode, setMode] = useState<"inherit" | "custom">(hasOwn ? "custom" : "inherit");
  return (
    <div className="grid gap-1.5 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <div className="flex items-center gap-3 text-xs font-medium">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name={`${field}_mode`}
              value="inherit"
              checked={mode === "inherit"}
              onChange={() => {
                setMode("inherit");
                onModeChange?.("inherit");
              }}
              className="accent-brand"
            />
            Heredado
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name={`${field}_mode`}
              value="custom"
              checked={mode === "custom"}
              onChange={() => {
                setMode("custom");
                onModeChange?.("custom");
              }}
              className="accent-brand"
            />
            Personalizado
          </label>
        </div>
      </div>
      {mode === "inherit" ? <p className="text-xs text-text-muted">{effectiveLabel}</p> : <div className="mt-1">{children}</div>}
    </div>
  );
}

function effectiveText(hasValue: boolean, inheritedFromName: string | null, formatted: string) {
  if (!hasValue) return "Sin definir en ningún ancestro; se usará el valor por defecto.";
  return inheritedFromName ? `Heredado de ${inheritedFromName}: ${formatted}` : `Sin valor propio ni heredado todavía: ${formatted}`;
}

const inputClassName = "h-9 w-full rounded-md border border-border bg-surface px-3 text-sm";

export function ZoneConfigForm(props: ZoneConfigFormProps) {
  const [state, action, pending] = useActionState(updateZoneConfigAction, INITIAL_ADMIN_ACTION_STATE);
  const [sameDayCustomOn, setSameDayCustomOn] = useState(props.sameDayAvailable.own === true);

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="zoneId" value={props.zoneId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Nombre
          <input name="name" defaultValue={props.name} required minLength={2} maxLength={80} className={inputClassName} />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Estado
          <select name="status" defaultValue={props.status} className={inputClassName}>
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
          </select>
          {!props.ancestorsActive ? (
            <span className="text-xs text-warning">Un ancestro de esta zona está inactivo: aunque quede “Activa”, no será una opción válida en el checkout hasta reactivarlo.</span>
          ) : null}
        </label>
      </div>

      <FieldShell
        field="fee"
        label="Tarifa de envío (COP)"
        hasOwn={props.fee.own !== null}
        effectiveLabel={effectiveText(props.fee.effective !== null, props.fee.inheritedFromName, props.fee.effective !== null ? money(props.fee.effective) : "")}
      >
        <input name="fee" type="number" min={0} step={100} defaultValue={props.fee.own ?? undefined} className={inputClassName} placeholder="Ej. 8000" />
      </FieldShell>

      <FieldShell
        field="freeShippingThreshold"
        label="Envío gratis desde (COP)"
        hasOwn={props.freeShippingThreshold.own !== null}
        effectiveLabel={effectiveText(props.freeShippingThreshold.effective !== null, props.freeShippingThreshold.inheritedFromName, props.freeShippingThreshold.effective !== null ? money(props.freeShippingThreshold.effective) : "")}
      >
        <input name="freeShippingThreshold" type="number" min={0} step={1000} defaultValue={props.freeShippingThreshold.own ?? undefined} className={inputClassName} placeholder="Vacío = sin envío gratis" />
      </FieldShell>

      <FieldShell
        field="coverage"
        label="Cobertura"
        hasOwn={props.coverage.own !== null}
        effectiveLabel={effectiveText(props.coverage.effective !== null, props.coverage.inheritedFromName, props.coverage.effective === "unavailable" ? "Sin cobertura" : "Con cobertura")}
      >
        <select name="coverage" defaultValue={props.coverage.own ?? "available"} className={inputClassName}>
          <option value="available">Con cobertura</option>
          <option value="unavailable">Sin cobertura</option>
        </select>
      </FieldShell>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldShell
          field="cashOnDeliveryAllowed"
          label="Contraentrega"
          hasOwn={props.cashOnDeliveryAllowed.own !== null}
          effectiveLabel={effectiveText(props.cashOnDeliveryAllowed.effective !== null, props.cashOnDeliveryAllowed.inheritedFromName, props.cashOnDeliveryAllowed.effective ? "Permitida" : "No permitida")}
        >
          <label className="flex items-center gap-2 text-sm">
            <input name="cashOnDeliveryAllowed" type="checkbox" defaultChecked={props.cashOnDeliveryAllowed.own ?? false} className="h-4 w-4 accent-brand" />
            Permitir pago contraentrega
          </label>
        </FieldShell>

        <FieldShell
          field="requiresAdvancePayment"
          label="Anticipo obligatorio"
          hasOwn={props.requiresAdvancePayment.own !== null}
          effectiveLabel={effectiveText(props.requiresAdvancePayment.effective !== null, props.requiresAdvancePayment.inheritedFromName, props.requiresAdvancePayment.effective ? "Exige anticipo" : "No exige anticipo")}
        >
          <label className="flex items-center gap-2 text-sm">
            <input name="requiresAdvancePayment" type="checkbox" defaultChecked={props.requiresAdvancePayment.own ?? false} className="h-4 w-4 accent-brand" />
            Exigir anticipo antes del envío
          </label>
        </FieldShell>
      </div>

      <FieldShell
        field="advancePercentage"
        label="Porcentaje de anticipo"
        hasOwn={props.advancePercentage.own !== null}
        effectiveLabel={effectiveText(props.advancePercentage.effective !== null, props.advancePercentage.inheritedFromName, props.advancePercentage.effective !== null ? `${props.advancePercentage.effective}%` : "")}
      >
        <input name="advancePercentage" type="number" min={1} max={100} defaultValue={props.advancePercentage.own ?? undefined} className={inputClassName} placeholder="1 a 100" />
      </FieldShell>

      <FieldShell
        field="sameDayAvailable"
        label="Entrega el mismo día"
        hasOwn={props.sameDayAvailable.own !== null}
        effectiveLabel={effectiveText(props.sameDayAvailable.effective !== null, props.sameDayAvailable.inheritedFromName, props.sameDayAvailable.effective ? "Disponible" : "No disponible")}
        onModeChange={(mode) => setSameDayCustomOn(mode === "custom")}
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            name="sameDayAvailable"
            type="checkbox"
            defaultChecked={props.sameDayAvailable.own ?? false}
            onChange={(event) => setSameDayCustomOn(event.currentTarget.checked)}
            className="h-4 w-4 accent-brand"
          />
          Ofrecer entrega el mismo día
        </label>
      </FieldShell>

      {sameDayCustomOn ? (
        <FieldShell
          field="sameDayCutoffHour"
          label="Hora límite para mismo día"
          hasOwn={props.sameDayCutoffHour.own !== null}
          effectiveLabel={effectiveText(props.sameDayCutoffHour.effective !== null, props.sameDayCutoffHour.inheritedFromName, props.sameDayCutoffHour.effective !== null ? `${props.sameDayCutoffHour.effective}:00` : "sin hora límite (aplica todo el día)")}
        >
          <input name="sameDayCutoffHour" type="number" min={0} max={23} defaultValue={props.sameDayCutoffHour.own ?? undefined} className={inputClassName} placeholder="0 a 23, hora de Bogotá" />
        </FieldShell>
      ) : null}

      <div className={cn("grid gap-3 sm:grid-cols-2", sameDayCustomOn && "opacity-70")}>
        <FieldShell
          field="estimatedBusinessDaysMin"
          label="Días hábiles mínimos"
          hasOwn={props.estimatedBusinessDaysMin.own !== null}
          effectiveLabel={effectiveText(props.estimatedBusinessDaysMin.effective !== null, props.estimatedBusinessDaysMin.inheritedFromName, String(props.estimatedBusinessDaysMin.effective ?? ""))}
        >
          <input name="estimatedBusinessDaysMin" type="number" min={0} defaultValue={props.estimatedBusinessDaysMin.own ?? undefined} className={inputClassName} />
        </FieldShell>
        <FieldShell
          field="estimatedBusinessDaysMax"
          label="Días hábiles máximos"
          hasOwn={props.estimatedBusinessDaysMax.own !== null}
          effectiveLabel={effectiveText(props.estimatedBusinessDaysMax.effective !== null, props.estimatedBusinessDaysMax.inheritedFromName, String(props.estimatedBusinessDaysMax.effective ?? ""))}
        >
          <input name="estimatedBusinessDaysMax" type="number" min={0} defaultValue={props.estimatedBusinessDaysMax.own ?? undefined} className={inputClassName} />
        </FieldShell>
      </div>
      {sameDayCustomOn ? (
        <p className="-mt-2 text-xs text-text-muted">
          Los días hábiles solo se usan como respaldo si el pedido llega después de la hora límite del mismo día.
        </p>
      ) : null}

      <FieldShell
        field="allowedPaymentMethods"
        label="Métodos de pago permitidos"
        hasOwn={props.allowedPaymentMethods.own !== null}
        effectiveLabel={effectiveText((props.allowedPaymentMethods.effective?.length ?? 0) > 0, props.allowedPaymentMethods.inheritedFromName, (props.allowedPaymentMethods.effective ?? []).map((id) => PAYMENT_METHOD_OPTIONS.find((option) => option.value === id)?.label ?? id).join(", "))}
      >
        <div className="grid gap-1.5">
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="allowedPaymentMethods"
                value={option.value}
                defaultChecked={props.allowedPaymentMethods.own?.includes(option.value) ?? false}
                className="h-4 w-4 accent-brand"
              />
              {option.label}
            </label>
          ))}
        </div>
      </FieldShell>

      <FieldShell
        field="customerMessage"
        label="Mensaje al cliente"
        hasOwn={props.customerMessage.own !== null}
        effectiveLabel={effectiveText(Boolean(props.customerMessage.effective), props.customerMessage.inheritedFromName, props.customerMessage.effective ?? "")}
      >
        <textarea name="customerMessage" defaultValue={props.customerMessage.own ?? ""} maxLength={300} className="min-h-20 w-full rounded-md border border-border bg-surface p-3 text-sm" placeholder="Ej. Entrega el mismo día pidiendo antes de las 2:00 p.m." />
      </FieldShell>

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={pending} className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        {state.status !== "idle" ? (
          <p role={state.status === "error" ? "alert" : "status"} className={cn("text-sm", state.status === "error" ? "text-danger" : "text-success")}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
