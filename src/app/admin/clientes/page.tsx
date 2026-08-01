import Link from "next/link";
import { desc, like, or, sql } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminDataResetForm } from "@/components/admin/admin-data-reset-form";
import { resetConfirmation } from "@/modules/admin/data-reset";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { customers } from "@/infrastructure/db/schema";
import { clearCustomersAction } from "../data-reset-actions";

const PAGE_SIZE = 30;

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const session = await requirePermission("customers", "read");
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);
  const filters = query
    ? or(like(customers.fullName, `%${query}%`), like(customers.phone, `%${query}%`), like(customers.email, `%${query}%`))
    : undefined;
  const db = await getRuntimeDb();
  const [rows, countRows, [{ total: totalCustomers }]] = await Promise.all([
    db.select().from(customers).where(filters).orderBy(desc(customers.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ count: sql<number>`count(*)` }).from(customers).where(filters),
    db.select({ total: sql<number>`count(*)` }).from(customers),
  ]);
  const filteredTotal = Number(countRows[0]?.count ?? 0);
  const urlParams = new URLSearchParams(Object.entries(params).filter(([key, value]) => key !== "page" && value).map(([key, value]) => [key, value!]));

  return (
    <>
      <AdminPageHeader title="Clientes" description={`${totalCustomers} cliente(s) registrados.`} />
      <form className="mb-5 grid gap-3 rounded-xl border border-border bg-surface-raised p-4 md:grid-cols-[minmax(220px,1fr)_auto]">
        <label className="grid gap-1 text-xs font-semibold">
          Buscar
          <input name="q" defaultValue={params.q} placeholder="Nombre, teléfono o correo" className="h-10 rounded-md border border-border px-3 text-sm font-normal" />
        </label>
        <button className="h-10 self-end rounded-md bg-text px-5 text-sm font-semibold text-text-inverted">Aplicar</button>
      </form>
      <section className="overflow-hidden rounded-xl border border-border bg-surface-raised">
        <div className="border-b border-border p-4">
          <h2>Clientes</h2>
          <p className="mt-1 text-sm text-text-muted">{filteredTotal} cliente(s) coinciden con los filtros.</p>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-surface-sunken/70 text-left">
                <tr>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3">Correo</th>
                  <th className="p-3">Último pedido</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border hover:bg-surface-sunken/30">
                    <td className="p-3">
                      <Link href={`/admin/clientes/${row.id}`} className="font-semibold text-brand hover:underline">{row.fullName}</Link>
                    </td>
                    <td className="p-3">{row.phone}</td>
                    <td className="p-3">{row.email ?? "—"}</td>
                    <td className="p-3">{row.lastOrderAt?.toLocaleDateString("es-CO") ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <p className="font-semibold">{totalCustomers ? "No hay coincidencias con el filtro." : "Todavía no hay clientes."}</p>
            {!totalCustomers ? <p className="mt-1 text-sm text-text-muted">Los perfiles aparecerán automáticamente cuando se registre el primer pedido.</p> : null}
          </div>
        )}
        {filteredTotal > PAGE_SIZE ? (
          <nav className="flex items-center justify-between border-t border-border p-4 text-sm" aria-label="Paginación de clientes">
            <span>Página {page} de {Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE))}</span>
            <div className="flex gap-2">
              {page > 1 ? <a className="rounded-md border border-border px-3 py-2" href={`?${urlParams}&page=${page - 1}`}>Anterior</a> : null}
              {page * PAGE_SIZE < filteredTotal ? <a className="rounded-md border border-border px-3 py-2" href={`?${urlParams}&page=${page + 1}`}>Siguiente</a> : null}
            </div>
          </nav>
        ) : null}
      </section>
      {session.roles.includes("owner") ? (
        <div className="mt-8">
          <AdminDataResetForm
            title="Limpiar todos los clientes"
            description="Elimina perfiles, direcciones y consentimientos asociados. Los pedidos existentes conservan su instantánea histórica sin vínculo al perfil eliminado."
            confirmation={resetConfirmation("customers")}
            action={clearCustomersAction}
          />
        </div>
      ) : null}
    </>
  );
}
