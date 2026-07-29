import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { products } from "@/infrastructure/db/schema";
import { createProductAction, updateProductStatusAction } from "../actions";
import { CsvImportForm } from "./csv-import-form";

export const metadata: Metadata = { title: "Productos" };

export default async function AdminProductsPage() {
  await requirePermission("catalog", "read");
  const db = await getRuntimeDb();
  const rows = await db.select().from(products).orderBy(desc(products.updatedAt));
  return (
    <>
      <AdminPageHeader title="Productos" description={`${rows.length} productos persistidos.`} actions={<Link href="/admin/productos/edicion-masiva" className="rounded-md border border-border px-4 py-2 text-sm font-semibold">Editar varios productos</Link>} />
      <CsvImportForm />
      <form action={createProductAction} className="mb-6 grid gap-3 rounded-lg border border-border bg-surface-raised p-4 md:grid-cols-3">
        <input name="name" required placeholder="Nombre" className="rounded-md border border-border p-2" />
        <input name="slug" required placeholder="slug-del-producto" className="rounded-md border border-border p-2" />
        <input name="sku" required placeholder="SKU" className="rounded-md border border-border p-2" />
        <input name="price" required type="number" min="0" placeholder="Precio COP" className="rounded-md border border-border p-2" />
        <input name="compareAtPrice" type="number" min="0" placeholder="Precio comparativo" className="rounded-md border border-border p-2" />
        <select name="status" className="rounded-md border border-border p-2"><option value="draft">Borrador</option><option value="active">Activo</option><option value="archived">Archivado</option></select>
        <input name="shortDescription" placeholder="Descripción corta" className="rounded-md border border-border p-2 md:col-span-2" />
        <button className="rounded-md bg-brand px-4 py-2 font-semibold text-white">Crear producto</button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised">
        <table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Producto</th><th>SKU</th><th>Precio</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-b border-border">
            <td className="p-3 font-medium"><Link href={`/admin/productos/${row.id}`} className="text-brand hover:underline">{row.name}</Link></td><td>{row.sku}</td><td>${row.price.toLocaleString("es-CO")}</td><td>{row.status}</td>
            <td><form action={updateProductStatusAction} className="flex gap-2 p-2">
              <input type="hidden" name="id" value={row.id} /><input type="hidden" name="updatedAt" value={row.updatedAt.toISOString()} />
              <select name="status" defaultValue={row.status} className="rounded border p-1"><option value="draft">Borrador</option><option value="active">Activo</option><option value="archived">Archivado</option></select>
              <button className="rounded border px-2">Guardar</button>
            </form></td>
          </tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
