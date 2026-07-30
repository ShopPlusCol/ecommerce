import { asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { mediaAssets, pageSections, pageVersions, pages } from "@/infrastructure/db/schema";
import { requirePermission } from "@/modules/auth/session";
import { BlockList } from "../block-list";
import { AddBlockForm, PageSettingsForm, PublishForm, RestoreVersionForm } from "../editor-forms";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("content", "read");
  const { id } = await params;
  const db = await getRuntimeDb();
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) notFound();
  const versions = await db.select().from(pageVersions).where(eq(pageVersions.pageId, id)).orderBy(desc(pageVersions.versionNumber));
  const latest = versions[0];
  const sections = latest ? await db.select().from(pageSections).where(eq(pageSections.pageVersionId, latest.id)).orderBy(asc(pageSections.order)) : [];
  const media = await db.select({ url: mediaAssets.url, altText: mediaAssets.altText }).from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
  const hasDraft = latest && latest.id !== page.publishedVersionId;
  return (
    <>
      <AdminPageHeader title={page.title} description={`Editor de /${page.slug}. ${hasDraft ? `La versión ${latest.versionNumber} tiene cambios sin publicar.` : "La versión visible coincide con la publicada."}`} actions={<PublishForm pageId={id} previewHref={`/admin/editor/${id}/preview`} />} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="grid gap-6">
          <section className="rounded-xl border border-border bg-surface-raised p-5"><h2 className="mb-4 text-lg font-semibold">Información y posicionamiento</h2><PageSettingsForm page={page} /></section>
          <section className="rounded-xl border border-border bg-surface-raised p-5"><h2 className="mb-1 text-lg font-semibold">Agregar bloque</h2><p className="mb-4 text-sm text-text-muted">Cada bloque empieza con contenido de ejemplo válido y puede ocultarse por dispositivo.</p><AddBlockForm pageId={id} /></section>
          <section><div className="mb-3"><h2 className="text-lg font-semibold">Bloques del borrador</h2><p className="text-sm text-text-muted">Arrastra desde <span aria-hidden="true">⠿</span> para reordenar, o usa ↑/↓. Duplica y edita cada bloque. Publicar es una acción separada.</p></div>{sections.length ? <BlockList pageId={id} sections={sections} media={media.map((item) => ({ url: item.url, label: item.altText || item.url }))} /> : <div className="rounded-xl border border-dashed border-border-strong p-10 text-center"><h3 className="font-semibold">El borrador está vacío</h3><p className="mt-1 text-sm text-text-muted">Agrega una portada, colección o sección de contenido para comenzar.</p></div>}</section>
        </main>
        <aside className="h-fit rounded-xl border border-border bg-surface-raised p-5 xl:sticky xl:top-5"><h2 className="text-lg font-semibold">Historial de versiones</h2><p className="mt-1 text-sm text-text-muted">Restaurar crea un borrador nuevo: nunca altera una versión publicada.</p><ol className="mt-4 grid gap-3">{versions.map((version, index) => <li key={version.id} className="grid gap-2 rounded-lg border border-border p-3"><div className="flex items-center justify-between gap-2"><span className="font-semibold">Versión {version.versionNumber}</span>{version.id === page.publishedVersionId ? <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">Publicada</span> : version.publishedAt ? <span className="rounded-full bg-surface-sunken px-2 py-1 text-xs font-semibold">Histórica</span> : <span className="rounded-full bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">Borrador</span>}</div><p className="text-xs text-text-muted">{version.createdAt.toLocaleString("es-CO")}</p><RestoreVersionForm pageId={id} versionId={version.id} versionNumber={version.versionNumber} isLatest={index === 0} /></li>)}</ol></aside>
      </div>
    </>
  );
}
