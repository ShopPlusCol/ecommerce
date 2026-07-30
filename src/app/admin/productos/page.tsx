import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { PackageSearch } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { productMedia, products } from "@/infrastructure/db/schema";
import { createProductAction, updateProductStatusAction } from "../actions";
import { CsvImportForm } from "./csv-import-form";

export const metadata: Metadata = { title: "Productos" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requirePermission("catalog", "read");
  const params = await searchParams;
  const query = params.q?.trim().toLocaleLowerCase("es-CO") ?? "";
  const statusFilter = params.status ?? "all";
  const db = await getRuntimeDb();
  const [rows, imageRows] = await Promise.all([
    db.select().from(products).orderBy(desc(products.updatedAt)),
    db.select().from(productMedia).orderBy(asc(productMedia.order)),
  ]);
  const coverByProduct = new Map<string, string>();
  for (const image of imageRows) {
    if (!coverByProduct.has(image.productId)) coverByProduct.set(image.productId, image.url);
  }
  const filteredRows = rows.filter((product) => {
    const matchesQuery = !query || `${product.name} ${product.sku}`.toLocaleLowerCase("es-CO").includes(query);
    return matchesQuery && (statusFilter === "all" || product.status === statusFilter);
  });

  return (
    <>
      <AdminPageHeader
        title="Productos"
        description={`${rows.length} producto${rows.length === 1 ? "" : "s"} persistidos.`}
        actions={<Link href="/admin/productos/edicion-masiva" className="inline-flex h-10 items-center rounded-md border border-border bg-surface-raised px-4 text-sm font-semibold">Editar varios productos</Link>}
      />
      <CsvImportForm />
      <form action={createProductAction} className="mb-6 grid gap-3 rounded-xl border border-border bg-surface-raised p-4 md:grid-cols-3">
        <h2 className="text-sm font-semibold md:col-span-3">Crear un nuevo producto</h2>
        <label className="grid gap-1 text-xs font-semibold">Nombre<input name="name" required placeholder="Nombre" className="h-10 rounded-md border border-border px-3 text-sm font-normal" /></label>
        <label className="grid gap-1 text-xs font-semibold">Slug<input name="slug" required placeholder="slug-del-producto" className="h-10 rounded-md border border-border px-3 text-sm font-normal" /></label>
        <label className="grid gap-1 text-xs font-semibold">SKU<input name="sku" required placeholder="SKU" className="h-10 rounded-md border border-border px-3 text-sm font-normal" /></label>
        <label className="grid gap-1 text-xs font-semibold">Precio COP<input name="price" required type="number" min="0" placeholder="49000" className="h-10 rounded-md border border-border px-3 text-sm font-normal" /></label>
        <label className="grid gap-1 text-xs font-semibold">Precio comparativo<input name="compareAtPrice" type="number" min="0" placeholder="Opcional" className="h-10 rounded-md border border-border px-3 text-sm font-normal" /></label>
        <label className="grid gap-1 text-xs font-semibold">Estado<select name="status" className="h-10 rounded-md border border-border px-3 text-sm font-normal"><option value="draft">Borrador</option><option value="active">Activo</option><option value="archived">Archivado</option></select></label>
        <label className="grid gap-1 text-xs font-semibold md:col-span-2">Descripción corta<input name="shortDescription" placeholder="Descripción corta" className="h-10 rounded-md border border-border px-3 text-sm font-normal" /></label>
        <button className="h-10 self-end rounded-md bg-brand px-5 text-sm font-semibold text-white">Crear producto</button>
      </form>
      <form className="mb-5 grid gap-3 rounded-xl border border-border bg-surface-raised p-4 md:grid-cols-[minmax(220px,1fr)_200px_auto]">
        <label className="grid gap-1 text-xs font-semibold">Buscar<input name="q" defaultValue={params.q} placeholder="Nombre o SKU" className="h-10 rounded-md border border-border px-3 text-sm font-normal" /></label>
        <label className="grid gap-1 text-xs font-semibold">Estado<select name="status" defaultValue={statusFilter} className="h-10 rounded-md border border-border px-3 text-sm font-normal"><option value="all">Todos</option><option value="draft">Borrador</option><option value="active">Activo</option><option value="archived">Archivado</option></select></label>
        <button className="h-10 self-end rounded-md bg-text px-5 text-sm font-semibold text-text-inverted">Aplicar</button>
      </form>
      <section className="overflow-hidden rounded-xl border border-border bg-surface-raised">
        <div className="border-b border-border p-4">
          <h2>Catálogo</h2>
          <p className="mt-1 text-sm text-text-muted">{filteredRows.length} producto(s) coinciden con los filtros.</p>
        </div>
        {filteredRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-surface-sunken/70 text-left">
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3 text-right">Precio</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Cambiar estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const cover = coverByProduct.get(row.id);
                  return (
                    <tr key={row.id} className="border-t border-border align-middle hover:bg-surface-sunken/30">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border bg-surface-sunken">
                            {cover ? <Image src={cover} alt="" width={44} height={44} unoptimized className="h-11 w-11 object-cover" /> : null}
                          </div>
                          <Link href={`/admin/productos/${row.id}`} className="font-semibold text-brand hover:underline">{row.name}</Link>
                        </div>
                      </td>
                      <td className="p-3 text-text-muted">{row.sku}</td>
                      <td className="p-3 text-right font-semibold tabular-nums">${row.price.toLocaleString("es-CO")}</td>
                      <td className="p-3"><AdminStatusBadge status={row.status} /></td>
                      <td className="p-3">
                        <form action={updateProductStatusAction} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="updatedAt" value={row.updatedAt.toISOString()} />
                          <select name="status" defaultValue={row.status} className="h-8 rounded-md border border-border px-2 text-xs">
                            <option value="draft">Borrador</option>
                            <option value="active">Activo</option>
                            <option value="archived">Archivado</option>
                          </select>
                          <button className="h-8 rounded-md border border-border px-3 text-xs font-semibold">Guardar</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <PackageSearch className="mx-auto h-8 w-8 text-text-subtle" />
            <h3 className="mt-3">{rows.length ? "No hay productos con estos filtros" : "Todavía no hay productos"}</h3>
            <p className="mt-1 text-sm text-text-muted">{rows.length ? "Cambia la búsqueda o el estado." : "Crea el primero con el formulario de arriba o impórtalo por CSV."}</p>
          </div>
        )}
      </section>
    </>
  );
}
