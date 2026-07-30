import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { AlertTriangle, Boxes, ClipboardClock, PackageCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { requirePermission } from "@/modules/auth/session";
import { inventoryAvailable } from "@/modules/inventory/admin-inventory";
import { getRuntimeDb } from "@/infrastructure/db/client";
import {
  adminUsers,
  inventoryItems,
  inventoryMovements,
  inventoryReservations,
  orders,
  products,
} from "@/infrastructure/db/schema";
import {
  InventoryAdjustmentForm,
  ReleaseExpiredReservationsButton,
  ReservationReleaseForm,
} from "./inventory-forms";
import { BulkInventoryEditor } from "./bulk-inventory-editor";

export const metadata: Metadata = { title: "Inventario" };

const PAGE_SIZE = 40;

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    stock?: string;
    movement?: string;
    page?: string;
  }>;
}) {
  await requirePermission("inventory", "read");
  const params = await searchParams;
  const query = params.q?.trim().toLocaleLowerCase("es-CO") ?? "";
  const stockFilter = params.stock ?? "all";
  const movementFilter = params.movement ?? "all";
  const requestedPage = Math.max(1, Number(params.page) || 1);
  const db = await getRuntimeDb();
  const [stockRows, movementRows, reservationRows] = await Promise.all([
    db
      .select({ item: inventoryItems, product: products })
      .from(inventoryItems)
      .innerJoin(products, eq(products.id, inventoryItems.productId)),
    db
      .select({
        movement: inventoryMovements,
        productName: products.name,
        productSku: products.sku,
        adminName: adminUsers.fullName,
        orderNumber: orders.orderNumber,
      })
      .from(inventoryMovements)
      .innerJoin(inventoryItems, eq(inventoryItems.id, inventoryMovements.inventoryItemId))
      .innerJoin(products, eq(products.id, inventoryItems.productId))
      .leftJoin(adminUsers, eq(adminUsers.id, inventoryMovements.createdByUserId))
      .leftJoin(orders, eq(orders.id, inventoryMovements.referenceOrderId))
      .orderBy(desc(inventoryMovements.createdAt)),
    db
      .select({
        reservation: inventoryReservations,
        productName: products.name,
        productSku: products.sku,
        orderNumber: orders.orderNumber,
      })
      .from(inventoryReservations)
      .innerJoin(inventoryItems, eq(inventoryItems.id, inventoryReservations.inventoryItemId))
      .innerJoin(products, eq(products.id, inventoryItems.productId))
      .leftJoin(orders, eq(orders.id, inventoryReservations.orderId))
      .orderBy(desc(inventoryReservations.createdAt)),
  ]);

  const lowStockRows = stockRows.filter(
    ({ item, product }) =>
      inventoryAvailable(item) <= product.lowStockThreshold && product.status === "active",
  );
  const outOfStockRows = stockRows.filter(({ item }) => inventoryAvailable(item) <= 0);
  const activeReservations = reservationRows.filter(({ reservation }) => reservation.status === "active");
  const filteredStock = stockRows.filter(({ item, product }) => {
    const matchesQuery =
      !query ||
      `${product.name} ${product.sku}`.toLocaleLowerCase("es-CO").includes(query);
    const available = inventoryAvailable(item);
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && available <= product.lowStockThreshold) ||
      (stockFilter === "out" && available <= 0) ||
      (stockFilter === "available" && available > product.lowStockThreshold);
    return matchesQuery && matchesStock;
  });
  const filteredMovements = movementRows.filter(({ movement, productName, productSku }) => {
    const matchesQuery =
      !query ||
      `${productName} ${productSku} ${movement.reason ?? ""}`
        .toLocaleLowerCase("es-CO")
        .includes(query);
    return matchesQuery && (movementFilter === "all" || movement.type === movementFilter);
  });
  const pageCount = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const visibleMovements = filteredMovements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <AdminPageHeader
        title="Inventario"
        description="Existencias físicas, reservas, disponibilidad y trazabilidad operativa."
        actions={
          <>
            <Link
              href="/api/admin/exports/inventory"
              className="inline-flex h-10 items-center rounded-md border border-border bg-surface-raised px-4 text-sm font-semibold"
            >
              Exportar CSV
            </Link>
            <ReleaseExpiredReservationsButton />
          </>
        }
      />
      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de inventario">
        {[
          { label: "Referencias", value: stockRows.length, icon: Boxes, tone: "text-info bg-info-soft" },
          { label: "Stock bajo", value: lowStockRows.length, icon: AlertTriangle, tone: "text-warning bg-warning-soft" },
          { label: "Agotadas", value: outOfStockRows.length, icon: PackageCheck, tone: "text-danger bg-danger-soft" },
          { label: "Reservas activas", value: activeReservations.length, icon: ClipboardClock, tone: "text-brand bg-brand-soft" },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="flex items-center gap-4 rounded-xl border border-border bg-surface-raised p-4">
              <span className={`grid h-10 w-10 place-items-center rounded-lg ${metric.tone}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-text-subtle">{metric.label}</p><p className="text-2xl font-semibold tabular-nums">{metric.value}</p></div>
            </article>
          );
        })}
      </section>
      <BulkInventoryEditor
        rows={stockRows.map(({ item, product }) => ({
          itemId: item.id,
          productName: product.name,
          sku: product.sku,
          quantityOnHand: item.quantityOnHand,
          available: inventoryAvailable(item),
        }))}
      />
      <form className="mb-5 grid gap-3 rounded-xl border border-border bg-surface-raised p-4 md:grid-cols-[minmax(220px,1fr)_180px_190px_auto]">
        <label className="grid gap-1 text-xs font-semibold">Buscar<input name="q" defaultValue={params.q} placeholder="Producto, SKU o motivo" className="h-10 rounded-md border border-border px-3 text-sm font-normal" /></label>
        <label className="grid gap-1 text-xs font-semibold">Existencias<select name="stock" defaultValue={stockFilter} className="h-10 rounded-md border border-border px-3 text-sm font-normal"><option value="all">Todas</option><option value="low">Stock bajo</option><option value="out">Agotadas</option><option value="available">Disponibles</option></select></label>
        <label className="grid gap-1 text-xs font-semibold">Movimientos<select name="movement" defaultValue={movementFilter} className="h-10 rounded-md border border-border px-3 text-sm font-normal"><option value="all">Todos</option><option value="restock">Entradas</option><option value="sale">Ventas</option><option value="reservation">Reservas</option><option value="release">Liberaciones</option><option value="manual_adjustment">Ajustes</option><option value="return">Devoluciones</option></select></label>
        <button className="self-end h-10 rounded-md bg-text px-5 text-sm font-semibold text-text-inverted">Aplicar</button>
      </form>
      <section className="mb-8 overflow-hidden rounded-xl border border-border bg-surface-raised">
        <div className="border-b border-border p-4"><h2>Existencias por producto</h2><p className="mt-1 text-sm text-text-muted">{filteredStock.length} referencias coinciden con los filtros.</p></div>
        {filteredStock.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-sm">
              <thead className="bg-surface-sunken/70 text-left"><tr><th className="p-3">Producto</th><th className="p-3 text-right">Físico</th><th className="p-3 text-right">Reservado</th><th className="p-3 text-right">Disponible</th><th className="p-3 text-right">Vendido</th><th className="p-3">Estado</th><th className="p-3">Registrar</th></tr></thead>
              <tbody>{filteredStock.map(({ item, product }) => {
                const available = inventoryAvailable(item);
                const status = available <= 0 ? "out_of_stock" : available <= product.lowStockThreshold ? "low_stock" : "available";
                return <tr key={item.id} className="border-t border-border align-top hover:bg-surface-sunken/30"><td className="p-3"><Link href={`/admin/productos/${product.id}`} className="font-semibold text-brand hover:underline">{product.name}</Link><span className="mt-0.5 block text-xs text-text-muted">{product.sku}</span></td><td className="p-3 text-right tabular-nums">{item.quantityOnHand}</td><td className="p-3 text-right tabular-nums">{item.quantityReserved}</td><td className="p-3 text-right font-semibold tabular-nums">{available}</td><td className="p-3 text-right tabular-nums">{item.quantitySold}</td><td className="p-3"><AdminStatusBadge status={status} /></td><td className="p-3"><InventoryAdjustmentForm itemId={item.id} /></td></tr>;
              })}</tbody>
            </table>
          </div>
        ) : <div className="p-10 text-center"><Boxes className="mx-auto h-8 w-8 text-text-subtle" /><h3 className="mt-3">No hay referencias con estos filtros</h3><p className="mt-1 text-sm text-text-muted">Cambia la búsqueda o el estado de existencias.</p></div>}
      </section>
      <section className="mb-8 overflow-hidden rounded-xl border border-border bg-surface-raised">
        <div className="border-b border-border p-4"><h2>Reservas</h2><p className="mt-1 text-sm text-text-muted">Las reservas activas reducen la disponibilidad sin descontar existencias físicas.</p></div>
        {reservationRows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[840px] text-sm"><thead className="bg-surface-sunken/70 text-left"><tr><th className="p-3">Producto</th><th className="p-3">Pedido</th><th className="p-3 text-right">Cantidad</th><th className="p-3">Vence</th><th className="p-3">Estado</th><th className="p-3">Acción</th></tr></thead><tbody>{reservationRows.map(({ reservation, productName, productSku, orderNumber }) => <tr key={reservation.id} className="border-t border-border align-top"><td className="p-3 font-medium">{productName}<span className="block text-xs text-text-muted">{productSku}</span></td><td className="p-3">{orderNumber ? <Link href={`/admin/pedidos/${reservation.orderId}`} className="text-brand hover:underline">{orderNumber}</Link> : reservation.orderId}</td><td className="p-3 text-right tabular-nums">{reservation.quantity}</td><td className="p-3">{reservation.expiresAt.toLocaleString("es-CO")}</td><td className="p-3"><AdminStatusBadge status={reservation.status} /></td><td className="p-3">{reservation.status === "active" ? <ReservationReleaseForm reservationId={reservation.id} /> : "Sin acciones"}</td></tr>)}</tbody></table></div> : <div className="p-10 text-center"><ClipboardClock className="mx-auto h-8 w-8 text-text-subtle" /><h3 className="mt-3">No existen reservas</h3><p className="mt-1 text-sm text-text-muted">Aparecerán cuando un checkout aparte unidades temporalmente.</p></div>}
      </section>
      <section className="overflow-hidden rounded-xl border border-border bg-surface-raised">
        <div className="border-b border-border p-4"><h2>Historial de movimientos</h2><p className="mt-1 text-sm text-text-muted">{filteredMovements.length} movimientos auditables.</p></div>
        {visibleMovements.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-surface-sunken/70 text-left"><tr><th className="p-3">Fecha</th><th className="p-3">Producto</th><th className="p-3">Tipo</th><th className="p-3 text-right">Cambio</th><th className="p-3">Motivo</th><th className="p-3">Pedido</th><th className="p-3">Responsable</th></tr></thead><tbody>{visibleMovements.map(({ movement, productName, productSku, adminName, orderNumber }) => <tr key={movement.id} className="border-t border-border"><td className="p-3 whitespace-nowrap">{movement.createdAt.toLocaleString("es-CO")}</td><td className="p-3 font-medium">{productName}<span className="block text-xs text-text-muted">{productSku}</span></td><td className="p-3"><AdminStatusBadge status={movement.type} /></td><td className={`p-3 text-right font-semibold tabular-nums ${movement.quantityDelta > 0 ? "text-success" : "text-danger"}`}>{movement.quantityDelta > 0 ? "+" : ""}{movement.quantityDelta}</td><td className="p-3">{movement.reason ?? "Sin motivo registrado"}</td><td className="p-3">{orderNumber && movement.referenceOrderId ? <Link href={`/admin/pedidos/${movement.referenceOrderId}`} className="text-brand hover:underline">{orderNumber}</Link> : "—"}</td><td className="p-3">{adminName ?? (movement.createdByUserId ? "Usuario retirado" : "Sistema")}</td></tr>)}</tbody></table></div> : <div className="p-10 text-center"><PackageCheck className="mx-auto h-8 w-8 text-text-subtle" /><h3 className="mt-3">Sin movimientos para mostrar</h3><p className="mt-1 text-sm text-text-muted">Registra una entrada o cambia los filtros.</p></div>}
        {pageCount > 1 ? <div className="flex items-center justify-between border-t border-border p-3 text-sm"><span className="text-text-muted">Página {page} de {pageCount}</span><div className="flex gap-2">{page > 1 ? <Link className="rounded-md border px-3 py-1.5" href={{ pathname: "/admin/inventario", query: { ...params, page: page - 1 } }}>Anterior</Link> : null}{page < pageCount ? <Link className="rounded-md border px-3 py-1.5" href={{ pathname: "/admin/inventario", query: { ...params, page: page + 1 } }}>Siguiente</Link> : null}</div></div> : null}
      </section>
    </>
  );
}
