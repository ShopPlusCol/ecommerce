import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/store/page-builder/block-renderer";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { pageSections, pageVersions, pages } from "@/infrastructure/db/schema";
import { requirePermission } from "@/modules/auth/session";
import { toBlock } from "@/modules/page-builder/editor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("content", "read");
  const { id } = await params;
  const db = await getRuntimeDb();
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) notFound();
  const [latest] = await db.select().from(pageVersions).where(eq(pageVersions.pageId, id)).orderBy(desc(pageVersions.versionNumber)).limit(1);
  const sections = latest ? await db.select().from(pageSections).where(eq(pageSections.pageVersionId, latest.id)).orderBy(asc(pageSections.order)) : [];
  return <div className="-m-4 sm:-m-6"><div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-raised/95 px-4 py-3 backdrop-blur"><div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Vista previa privada</p><p className="font-semibold">{page.title} · versión {latest?.versionNumber ?? 0}</p></div><Link href={`/admin/editor/${id}`} className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white">Volver al editor</Link></div>{sections.length ? <div className="bg-surface"><BlockRenderer blocks={sections.map(toBlock)} /></div> : <div className="p-12 text-center"><h1 className="text-xl font-semibold">El borrador no tiene bloques</h1><p className="mt-2 text-text-muted">Vuelve al editor y agrega el primer bloque.</p></div>}</div>;
}
