import Link from "next/link";
import { like, or } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { customers, orders, products } from "@/infrastructure/db/schema";
import { requirePermission } from "@/modules/auth/session";

export const metadata = { title: "Búsqueda" };

type SearchResult = {
  id: string;
  type: "Pedido" | "Producto" | "Cliente";
  title: string;
  detail: string;
  href: string;
};

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("dashboard", "read");
  const query = (await searchParams).q?.trim() ?? "";
  const results: SearchResult[] = [];

  if (query.length >= 2) {
    const db = await getRuntimeDb();
    const term = `%${query}%`;
    const [productRows, orderRows, customerRows] = await Promise.all([
      db
        .select({ id: products.id, name: products.name, sku: products.sku, status: products.status })
        .from(products)
        .where(or(like(products.name, term), like(products.sku, term), like(products.slug, term)))
        .limit(12),
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customer: orders.customerFullName,
          phone: orders.customerPhone,
        })
        .from(orders)
        .where(
          or(
            like(orders.orderNumber, term),
            like(orders.customerFullName, term),
            like(orders.customerPhone, term),
            like(orders.customerEmail, term),
          ),
        )
        .limit(12),
      db
        .select({ id: customers.id, name: customers.fullName, phone: customers.phone, email: customers.email })
        .from(customers)
        .where(or(like(customers.fullName, term), like(customers.phone, term), like(customers.email, term)))
        .limit(12),
    ]);

    results.push(
      ...orderRows.map((row) => ({
        id: row.id,
        type: "Pedido" as const,
        title: row.orderNumber,
        detail: `${row.customer} · ${row.phone}`,
        href: `/admin/pedidos/${row.id}`,
      })),
      ...productRows.map((row) => ({
        id: row.id,
        type: "Producto" as const,
        title: row.name,
        detail: `${row.sku} · ${row.status}`,
        href: `/admin/productos/${row.id}`,
      })),
      ...customerRows.map((row) => ({
        id: row.id,
        type: "Cliente" as const,
        title: row.name,
        detail: [row.phone, row.email].filter(Boolean).join(" · "),
        href: `/admin/clientes/${row.id}`,
      })),
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Búsqueda global"
        description={
          query.length >= 2
            ? `${results.length} coincidencias para “${query}”.`
            : "Escribe al menos dos caracteres para buscar."
        }
      />
      {results.length ? (
        <ul className="grid gap-3" aria-label="Resultados de búsqueda">
          {results.map((result) => (
            <li key={`${result.type}-${result.id}`}>
              <Link
                href={result.href}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-raised p-4 transition-colors hover:border-border-strong hover:bg-surface-sunken"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-text">{result.title}</span>
                  <span className="block truncate text-sm text-text-muted">{result.detail}</span>
                </span>
                <span className="shrink-0 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                  {result.type}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface-raised p-10 text-center text-sm text-text-muted">
          {query.length >= 2 ? "No encontramos resultados con esos datos." : "La búsqueda incluye pedidos, productos y clientes."}
        </div>
      )}
    </>
  );
}
