import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminRecordList } from "@/components/admin/admin-record-list";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { adminUsers, orderAdjustments, orderItems, orders, orderStatusHistory, payments, shipments } from "@/infrastructure/db/schema";
import { ORDER_STATUSES } from "@/infrastructure/db/schema/orders";
import { availableDirectTransitions, SENSITIVE_ORDER_STATUSES, type OrderStatus } from "@/domain/services/order-status";
import { adminStatusLabel } from "@/modules/admin/status-labels";
import { buildOrderCopyText } from "@/modules/admin/order-copy-text";
import { OrderCopyBlock } from "./order-copy-block";
import { OrderStatusForm } from "./order-status-form";

/** Etiquetas humanas de la sección "Origen del pedido". */
const UTM_LABELS: Array<{ key: string; label: string }> = [
  { key: "source", label: "Fuente" },
  { key: "medium", label: "Medio" },
  { key: "campaign", label: "Campaña" },
  { key: "content", label: "Contenido / anuncio" },
  { key: "term", label: "Término" },
];

function attributionRows(raw: unknown): Array<{ label: string; value: string }> {
  if (!raw || typeof raw !== "object") return [];
  const data = raw as Record<string, unknown>;
  return UTM_LABELS.map(({ key, label }) => ({ label, value: String(data[key] ?? "").trim() })).filter(
    (row) => row.value.length > 0,
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("orders", "read");
  const { id } = await params;
  const db = await getRuntimeDb();
  const [[order], items, adjustments, paymentRows, shipmentRows, history] = await Promise.all([
    db.select().from(orders).where(eq(orders.id, id)).limit(1),
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select().from(orderAdjustments).where(eq(orderAdjustments.orderId, id)),
    db.select().from(payments).where(eq(payments.orderId, id)),
    db.select().from(shipments).where(eq(shipments.orderId, id)),
    db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(desc(orderStatusHistory.createdAt)),
  ]);
  if (!order) notFound();

  // Nombres de quienes cambiaron el estado: el historial guardaba solo el id
  // interno del usuario, que no le dice nada a quien lee la ficha.
  const changedByIds = [...new Set(history.map((entry) => entry.changedByUserId).filter(Boolean))] as string[];
  const userNames = new Map<string, string>();
  if (changedByIds.length) {
    const rows = await db.select({ id: adminUsers.id, fullName: adminUsers.fullName }).from(adminUsers);
    for (const row of rows) userNames.set(row.id, row.fullName);
  }

  const copyText = buildOrderCopyText({
    fullName: order.customerFullName,
    phone: order.customerPhone,
    addressLine: order.shippingAddressLine,
    addressComplement: order.shippingAddressComplement,
    neighborhood: order.shippingNeighborhood,
    city: order.shippingCity,
    department: order.shippingDepartment,
    deliveryInstructions: order.deliveryInstructions,
    lines: items.map((item) => ({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice })),
    productsSubtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discountTotal: order.discountTotal,
    total: order.total,
    paymentMethod: order.paymentMethod,
    amountDueNow: order.amountDueNow,
    amountDueOnDelivery: order.amountDueOnDelivery,
  });

  const statusOptions = availableDirectTransitions(order.status as OrderStatus, ORDER_STATUSES).map((status) => ({
    value: status,
    label: adminStatusLabel(status),
  }));

  const firstAttribution = attributionRows(order.utmFirstAttribution);
  const lastAttribution = attributionRows(order.utmLastAttribution);
  const currentAttribution = attributionRows({
    source: order.utmSource,
    medium: order.utmMedium,
    campaign: order.utmCampaign,
    content: order.utmContent,
    term: order.utmTerm,
  });
  const hasAttribution = currentAttribution.length > 0 || firstAttribution.length > 0 || lastAttribution.length > 0;

  return (
    <>
      <AdminPageHeader
        title={order.orderNumber}
        description={`Creado ${order.createdAt.toLocaleString("es-CO")} · ${order.customerFullName}`}
        actions={<Link href={`/admin/clientes/${order.customerId}`} className="rounded-md border border-border px-4 py-2 text-sm font-semibold">Ver cliente</Link>}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="font-semibold">Resumen</h2>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-2"><dt>Estado</dt><dd><AdminStatusBadge status={order.status} /></dd></div>
            <div className="flex justify-between gap-2"><dt>Pago</dt><dd>{adminStatusLabel(order.paymentStatus)}</dd></div>
            <div className="flex justify-between gap-2"><dt>Forma de pago</dt><dd>{adminStatusLabel(order.paymentMethod)}</dd></div>
            <div className="flex justify-between gap-2"><dt>Total</dt><dd className="font-semibold">${order.total.toLocaleString("es-CO")}</dd></div>
            <div className="flex justify-between gap-2"><dt>Pagado</dt><dd>${order.amountPaid.toLocaleString("es-CO")}</dd></div>
            <div className="flex justify-between gap-2"><dt>Pago al recibir</dt><dd>${order.amountDueOnDelivery.toLocaleString("es-CO")}</dd></div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="font-semibold">Entrega</h2>
          <p className="mt-4 text-sm">
            {order.shippingAddressLine}
            {order.shippingAddressComplement ? <><br />{order.shippingAddressComplement}</> : null}
            <br />{order.shippingNeighborhood}, {order.shippingCity}
            <br />{order.shippingDepartment}
          </p>
          {order.deliveryInstructions ? <p className="mt-3 rounded-md bg-surface-sunken p-3 text-sm">{order.deliveryInstructions}</p> : null}
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="font-semibold">Cambiar estado</h2>
          <OrderStatusForm
            orderId={order.id}
            currentStatus={adminStatusLabel(order.status)}
            options={statusOptions}
            sensitiveStatuses={SENSITIVE_ORDER_STATUSES}
          />
        </section>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <OrderCopyBlock text={copyText} />

        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="font-semibold">Origen del pedido</h2>
          {hasAttribution ? (
            <div className="mt-4 grid gap-4 text-sm">
              {currentAttribution.length ? (
                <dl className="grid gap-1.5">
                  {currentAttribution.map((row) => (
                    <div key={row.label} className="flex justify-between gap-3">
                      <dt className="text-text-muted">{row.label}</dt>
                      <dd className="text-right font-medium">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {firstAttribution.length ? (
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">Primera vez que llegó</p>
                  <p className="mt-1 text-text-muted">
                    {firstAttribution.map((row) => `${row.label}: ${row.value}`).join(" · ")}
                  </p>
                </div>
              ) : null}

              {lastAttribution.length ? (
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">Última vez antes de comprar</p>
                  <p className="mt-1 text-text-muted">
                    {lastAttribution.map((row) => `${row.label}: ${row.value}`).join(" · ")}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-muted">
              Este pedido no trae origen registrado: la persona llegó directamente, sin pasar por un
              enlace de campaña.
            </p>
          )}
        </section>
      </div>

      <AdminRecordList
        title="Productos"
        description={`${items.length} líneas del pedido; son instantáneas y no cambian con el catálogo.`}
        columns={["Producto", "SKU", "Cantidad", "Precio", "Descuento"]}
        rows={items.map((item) => ({ id: item.id, values: [item.name, item.sku, item.quantity, `$${item.unitPrice.toLocaleString("es-CO")}`, `$${item.discount.toLocaleString("es-CO")}`] }))}
      />

      <div className="mt-8">
        <AdminRecordList
          title="Pagos y envíos"
          description={`${paymentRows.length} pagos · ${shipmentRows.length} envíos · ${adjustments.length} ajustes.`}
          columns={["Referencia", "Proveedor", "Monto", "Propósito", "Estado"]}
          rows={paymentRows.map((payment) => ({
            id: payment.id,
            values: [
              payment.externalReference,
              adminStatusLabel(payment.provider),
              `$${payment.amount.toLocaleString("es-CO")}`,
              adminStatusLabel(payment.purpose),
              adminStatusLabel(payment.status),
            ],
          }))}
        />
      </div>

      <div className="mt-8">
        <AdminRecordList
          title="Historial de estados"
          description="Se registra solo: qué cambió, cuándo y quién. La nota es opcional."
          columns={["Fecha", "Desde", "Hacia", "Nota", "Usuario"]}
          rows={history.map((entry) => ({
            id: entry.id,
            values: [
              entry.createdAt.toLocaleString("es-CO"),
              entry.fromStatus ? adminStatusLabel(entry.fromStatus) : "Inicio",
              adminStatusLabel(entry.toStatus),
              entry.note?.trim() || "—",
              (entry.changedByUserId && userNames.get(entry.changedByUserId)) || "Sistema",
            ],
          }))}
        />
      </div>
    </>
  );
}
