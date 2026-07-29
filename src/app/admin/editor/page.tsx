import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { pageSections, pageVersions, pages } from "@/infrastructure/db/schema";
import { CreatePageForm } from "./editor-forms";

export default async function Page() {
  await requirePermission("content", "read");
  const db = await getRuntimeDb();
  const rows = await db.select().from(pages).orderBy(desc(pages.updatedAt));
  const summaries = await Promise.all(rows.map(async (page) => {
    const [latest] = await db.select().from(pageVersions).where(eq(pageVersions.pageId, page.id)).orderBy(desc(pageVersions.versionNumber)).limit(1);
    const blocks = latest ? await db.select({ id: pageSections.id }).from(pageSections).where(eq(pageSections.pageVersionId, latest.id)) : [];
    return { page, latest, blockCount: blocks.length };
  }));
  return (
    <>
      <AdminPageHeader title="Editor visual" description="Crea páginas por bloques, prepara borradores y publica versiones que la tienda renderiza con el mismo contrato." />
      <CreatePageForm />
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Páginas</h2>
        {summaries.length ? <div className="grid gap-3">{summaries.map(({ page, latest, blockCount }) => {
          const hasDraft = latest && latest.id !== page.publishedVersionId;
          return <article key={page.id} className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface-raised p-5 sm:flex-row sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{page.title}</h3>{page.isHome ? <span className="rounded-full bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">Inicio</span> : null}<span className={`rounded-full px-2 py-1 text-xs font-semibold ${page.status === "published" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{page.status === "published" ? "Publicada" : "Borrador"}</span>{hasDraft ? <span className="rounded-full bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">Cambios sin publicar</span> : null}</div><p className="mt-1 text-sm text-text-muted">/{page.slug} · {blockCount} {blockCount === 1 ? "bloque" : "bloques"} · versión {latest?.versionNumber ?? 0}</p></div><Link href={`/admin/editor/${page.id}`} className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white">Editar página</Link></article>;
        })}</div> : <div className="rounded-xl border border-dashed border-border-strong p-10 text-center"><h3 className="font-semibold">Todavía no hay páginas editables</h3><p className="mt-1 text-sm text-text-muted">Crea el primer borrador para construir una página con bloques reutilizables.</p></div>}
      </section>
    </>
  );
}
