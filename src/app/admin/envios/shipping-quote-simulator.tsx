"use client";

import { useActionState } from "react";
import { Calculator, MapPin, WalletCards } from "lucide-react";
import {
  quoteShippingAdminAction,
  type AdminShippingQuoteState,
} from "./quote-actions";

const INITIAL_SHIPPING_QUOTE_STATE: AdminShippingQuoteState = {
  status: "idle",
  message: "",
};

export function ShippingQuoteSimulator() {
  const [state, action, pending] = useActionState(
    quoteShippingAdminAction,
    INITIAL_SHIPPING_QUOTE_STATE,
  );
  const input = "h-10 rounded-md border border-border bg-surface px-3 text-sm";
  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-border bg-surface-raised">
      <div className="flex items-start gap-3 border-b border-border p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-info-soft text-info">
          <Calculator className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2>Simulador administrativo de cotización</h2>
          <p className="mt-1 text-sm text-text-muted">
            Prueba destino, valor, prioridad, vigencia y métodos sin crear un pedido.
          </p>
        </div>
      </div>
      <form action={action} className="grid gap-4 p-5 md:grid-cols-3 xl:grid-cols-6">
        <label className="grid gap-1 text-xs font-semibold">País<input name="country" required minLength={2} maxLength={2} defaultValue="CO" className={input} /></label>
        <label className="grid gap-1 text-xs font-semibold">Departamento<input name="department" required defaultValue="Antioquia" className={input} /></label>
        <label className="grid gap-1 text-xs font-semibold">Ciudad<input name="city" required defaultValue="Medellín" className={input} /></label>
        <label className="grid gap-1 text-xs font-semibold">Barrio<input name="neighborhood" placeholder="Opcional" className={input} /></label>
        <label className="grid gap-1 text-xs font-semibold">Valor del pedido<input name="cartTotal" type="number" min="0" required defaultValue={100000} className={input} /></label>
        <button disabled={pending} className="self-end h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Cotizando…" : "Calcular tarifa"}</button>
      </form>
      {state.status !== "idle" ? (
        <div className="border-t border-border p-5">
          <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-sm font-medium text-danger" : "text-sm font-medium text-success"}>{state.message}</p>
          {state.quote ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <article className="rounded-lg bg-surface-sunken p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4" />Regla aplicada</div>
                <p className="mt-2 text-2xl font-semibold">${state.quote.fee.toLocaleString("es-CO")}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {state.quote.feeSource ? `Heredada de ${state.quote.feeSource.zoneName}` : "Tarifa propia de la zona resuelta"} · Nivel: {state.quote.ruleLevel}
                </p>
                <p className="mt-1 text-xs text-text-muted">ID de regla: {state.quote.ruleId}</p>
              </article>
              <article className="rounded-lg bg-surface-sunken p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><WalletCards className="h-4 w-4" />Métodos permitidos</div>
                <ul className="mt-2 grid gap-1 text-sm">{state.quote.methods.map((method) => <li key={method.id}>{method.label}</li>)}</ul>
              </article>
              <article className="rounded-lg bg-surface-sunken p-4">
                <p className="text-sm font-semibold">Condiciones</p>
                <p className="mt-2 text-sm">
                  {state.quote.sameDayEligible ? "Mismo día disponible ahora" : `${state.quote.estimatedBusinessDaysMin}–${state.quote.estimatedBusinessDaysMax} días hábiles`}
                </p>
                <p className="mt-1 text-sm">{state.quote.requiresAdvancePayment ? `Anticipo requerido${state.quote.advancePercentage ? `: ${state.quote.advancePercentage}%` : ""}` : "Sin anticipo obligatorio"}</p>
                {state.quote.customerMessage ? <p className="mt-2 text-xs text-text-muted">{state.quote.customerMessage}</p> : null}
              </article>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
