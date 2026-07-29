"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrderFinancialSummary } from "@/components/store/checkout/order-financial-summary";
import { formatMoney } from "@/domain/value-objects/money";
import { readLastOrder } from "@/modules/checkout/last-order";
import type { DemoOrder } from "@/modules/checkout/order-types";
import { uploadTransferProofAction } from "@/app/(store)/checkout/transfer-actions";

export function OrderConfirmationClient() {
  const [order, setOrder] = React.useState<DemoOrder | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    // Lee la instantánea de confirmación desde sessionStorage tras el montaje.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde almacenamiento del navegador
    setOrder(readLastOrder());
    setReady(true);
  }, []);

  if (!ready) {
    return <p className="text-center text-sm text-text-muted">Cargando…</p>;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Package className="h-10 w-10 text-text-subtle" aria-hidden="true" />
        <h1 className="text-2xl text-text">No hay un pedido reciente para mostrar</h1>
        <p className="max-w-prose text-text-muted">
          Esta página muestra la confirmación justo después de finalizar una compra. La consulta de
          pedidos requiere el número y código privado entregados al finalizar.
        </p>
        <Link href="/catalogo">
          <Button variant="secondary">Volver al catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" aria-hidden="true" />
        <h1 className="text-2xl text-text">¡Gracias por tu pedido!</h1>
        <p className="text-text-muted">
          Tu número de pedido es <strong className="text-text">{order.orderNumber}</strong>.
        </p>
        <span className="rounded-full bg-info-soft px-3 py-1 text-xs font-medium text-info">Pedido registrado</span>
        <p className="text-xs text-text-muted">Código privado de consulta: <code>{order.lookupToken}</code></p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="font-display text-md font-semibold text-text">Detalle</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {order.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-2">
                <span className="text-text-muted">
                  {item.quantity} × {item.name}
                </span>
                <span className="tabular-nums text-text">
                  {formatMoney({ amount: item.unitPrice * item.quantity, currency: "COP" })}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border pt-4">
            <OrderFinancialSummary summary={order.summary} />
          </div>
        </CardContent>
      </Card>

      {order.paymentMethod === "transfer_full" || order.paymentMethod === "shipping_advance_transfer" ? (
        <Card><CardContent>
          <h2 className="font-display text-md font-semibold text-text">Comprobante de transferencia</h2>
          {order.manualTransfer ? <div className="my-2 rounded-md bg-surface-sunken p-3 text-sm">
            <p>{order.manualTransfer.bankName} · {order.manualTransfer.accountType}</p>
            <p>{order.manualTransfer.accountNumber} · {order.manualTransfer.accountHolder}</p>
            <p className="mt-1 text-xs text-text-muted">{order.manualTransfer.instructions}</p>
          </div> : null}
          <p className="my-2 text-xs text-text-muted">La carga deja el pago pendiente de revisión; no lo aprueba automáticamente.</p>
          <form action={uploadTransferProofAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="orderNumber" value={order.orderNumber} />
            <input type="hidden" name="lookupToken" value={order.lookupToken} />
            <input type="file" name="proof" accept="image/png,image/jpeg,image/webp" required />
            <Button type="submit" variant="secondary">Enviar comprobante</Button>
          </form>
        </CardContent></Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-1 text-sm">
          <h2 className="font-display text-md font-semibold text-text">Entrega</h2>
          <p className="text-text-muted">{order.contact.fullName} · {order.contact.phone}</p>
          <p className="text-text-muted">
            {order.contact.addressLine}
            {order.contact.addressComplement ? `, ${order.contact.addressComplement}` : ""}
          </p>
          <p className="text-text-muted">
            {order.destination.neighborhood ? `${order.destination.neighborhood}, ` : ""}
            {order.destination.city}, {order.destination.department}
          </p>
          <p className="mt-2 text-xs text-text-subtle">{order.quote.customerMessage}</p>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Link href="/">
          <Button variant="secondary">Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
