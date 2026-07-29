"use client";

import { useActionState } from "react";
import { lookupOrderAction, type LookupState } from "./actions";

const INITIAL: LookupState = {};
export function LookupForm() {
  const [state, action, pending] = useActionState(lookupOrderAction, INITIAL);
  return <form action={action} className="flex flex-col gap-4">
    <label>Número de pedido<input name="orderNumber" required className="mt-1 w-full rounded-md border p-2" placeholder="SPC-…" /></label>
    <label>Código privado de consulta<input name="token" required className="mt-1 w-full rounded-md border p-2" /></label>
    <button disabled={pending} className="rounded-md bg-brand px-4 py-2 font-semibold text-white">{pending ? "Consultando…" : "Consultar estado"}</button>
    {state.error ? <p role="alert" className="text-error">{state.error}</p> : null}
    {state.order ? <div className="rounded-lg border p-4"><p className="font-semibold">{state.order.orderNumber}</p><p>Pedido: {state.order.status}</p><p>Pago: {state.order.paymentStatus}</p><p>Total: ${state.order.total.toLocaleString("es-CO")}</p><p>Destino: {state.order.shippingCity}</p></div> : null}
  </form>;
}
