import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { Banknote, Clock, FileCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { adminStatusLabel } from "@/modules/admin/status-labels";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { manualTransferProofs, mediaAssets, orders, payments } from "@/infrastructure/db/schema";
import { reviewManualTransferAction } from "../actions";

export const metadata: Metadata = { title: "Pagos" };

const PURPOSE_LABEL: Record<string, string> = {
  shipping_advance: "Anticipo de envío",
  full_payment: "Pago total",
  balance_on_delivery: "Saldo contraentrega",
};

const PAGE_SIZE = 30;

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requirePermission("payments", "read");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const db = await getRuntimeDb();
  const baseQuery = db
    .select({ payment: payments, proof: manualTransferProofs, asset: mediaAssets, orderNumber: orders.orderNumber })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .leftJoin(manualTransferProofs, eq(manualTransferProofs.paymentId, payments.id))
    .leftJoin(mediaAssets, eq(mediaAssets.id, manualTransferProofs.mediaAssetId));
  const [rows, [{ total }], [{ pendingCount }], [{ approvedCount }]] = await Promise.all([
    baseQuery.orderBy(desc(payments.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ total: sql<number>`count(*)` }).from(payments),
    db.select({ pendingCount: sql<number>`count(*)` }).from(manualTransferProofs).where(eq(manualTransferProofs.status, "pending")),
    db.select({ approvedCount: sql<number>`count(*)` }).from(payments).where(eq(payments.status, "approved")),
  ]);

  return (
    <>
      <AdminPageHeader title="Pagos" description="Los comprobantes de transferencia requieren revisión explícita antes de aprobar un pago." />
      <section className="mb-6 grid gap-3 sm:grid-cols-3" aria-label="Resumen de pagos">
        <article className="flex items-center gap-4 rounded-xl border border-border bg-surface-raised p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand"><Banknote className="h-5 w-5" aria-hidden="true" /></span>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">Pagos registrados</p><p className="text-2xl font-semibold tabular-nums">{total}</p></div>
        </article>
        <article className="flex items-center gap-4 rounded-xl border border-border bg-surface-raised p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-warning-soft text-warning"><Clock className="h-5 w-5" aria-hidden="true" /></span>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">Comprobantes pendientes</p><p className="text-2xl font-semibold tabular-nums">{pendingCount}</p></div>
        </article>
        <article className="flex items-center gap-4 rounded-xl border border-border bg-surface-raised p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-success-soft text-success"><FileCheck className="h-5 w-5" aria-hidden="true" /></span>
          <div><p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">Pagos aprobados</p><p className="text-2xl font-semibold tabular-nums">{approvedCount}</p></div>
        </article>
      </section>
      <section className="overflow-hidden rounded-xl border border-border bg-surface-raised">
        <div className="border-b border-border p-4">
          <h2>Movimientos de pago</h2>
          <p className="mt-1 text-sm text-text-muted">{total} pago(s) asociados a pedidos.</p>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-surface-sunken/70 text-left">
                <tr>
                  <th className="p-3">Pedido</th>
                  <th className="p-3">Proveedor</th>
                  <th className="p-3">Propósito</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Comprobante</th>
                  <th className="p-3">Revisión</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ payment, proof, asset, orderNumber }) => (
                  <tr key={`${payment.id}-${proof?.id ?? ""}`} className="border-t border-border align-top hover:bg-surface-sunken/30">
                    <td className="p-3">
                      <Link href={`/admin/pedidos/${payment.orderId}`} className="font-semibold text-brand hover:underline">{orderNumber}</Link>
                      <span className="mt-0.5 block text-xs text-text-muted">{payment.externalReference}</span>
                    </td>
                    <td className="p-3">{adminStatusLabel(payment.provider)}</td>
                    <td className="p-3">{PURPOSE_LABEL[payment.purpose] ?? payment.purpose}</td>
                    <td className="p-3 text-right font-semibold tabular-nums">${payment.amount.toLocaleString("es-CO")}</td>
                    <td className="p-3"><AdminStatusBadge status={proof?.status ?? payment.status} /></td>
                    <td className="p-3">{asset ? <Link href={asset.url} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">Ver comprobante</Link> : "Sin comprobante"}</td>
                    <td className="p-3">
                      {proof?.status === "pending" ? (
                        <form action={reviewManualTransferAction} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="proofId" value={proof.id} />
                          <label className="sr-only" htmlFor={`reason-${proof.id}`}>Motivo si rechaza</label>
                          <input id={`reason-${proof.id}`} name="reason" placeholder="Motivo si rechaza" className="h-8 w-36 rounded-md border border-border px-2 text-xs" />
                          <button name="decision" value="approved" className="h-8 rounded-md border border-success/30 px-2 text-xs font-semibold text-success">Aprobar</button>
                          <button name="decision" value="rejected" className="h-8 rounded-md border border-danger/30 px-2 text-xs font-semibold text-danger">Rechazar</button>
                        </form>
                      ) : (
                        <span className="text-text-muted">Sin acciones</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <Banknote className="mx-auto h-8 w-8 text-text-subtle" />
            <h3 className="mt-3">Todavía no hay pagos registrados</h3>
            <p className="mt-1 text-sm text-text-muted">Aparecerán aquí cuando un pedido registre un pago o un comprobante de transferencia.</p>
          </div>
        )}
        {Number(total) > PAGE_SIZE ? (
          <nav className="flex items-center justify-between border-t border-border p-4 text-sm" aria-label="Paginación de pagos">
            <span>Página {page} de {Math.max(1, Math.ceil(Number(total) / PAGE_SIZE))}</span>
            <div className="flex gap-2">
              {page > 1 ? <a className="rounded-md border border-border px-3 py-2" href={`?page=${page - 1}`}>Anterior</a> : null}
              {page * PAGE_SIZE < Number(total) ? <a className="rounded-md border border-border px-3 py-2" href={`?page=${page + 1}`}>Siguiente</a> : null}
            </div>
          </nav>
        ) : null}
      </section>
    </>
  );
}
