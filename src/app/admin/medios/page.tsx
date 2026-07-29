import Image from "next/image";
import { desc } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { mediaAssets } from "@/infrastructure/db/schema";
import { requirePermission } from "@/modules/auth/session";
import { MediaDeleteForm, MediaEditForm, MediaUploadForm } from "./media-forms";

export const metadata = { title: "Multimedia" };

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  await requirePermission("media", "read");
  const params = await searchParams;
  const query = params.q?.trim().toLocaleLowerCase("es-CO") ?? "";
  const type = params.type ?? "all";
  const rows = await (await getRuntimeDb()).select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
  const filtered = rows.filter((row) => {
    const matchesQuery = !query || `${row.storageKey} ${row.altText ?? ""}`.toLocaleLowerCase("es-CO").includes(query);
    const matchesType = type === "all" || row.contentType === type;
    return matchesQuery && matchesType;
  });
  const types = [...new Set(rows.map((row) => row.contentType))];

  return (
    <>
      <AdminPageHeader
        title="Biblioteca multimedia"
        description={`${filtered.length} de ${rows.length} archivos. PNG, JPEG, WebP y SVG se validan antes de almacenarse.`}
      />
      <MediaUploadForm />
      <form className="my-5 flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-3 sm:flex-row">
        <label className="grid flex-1 gap-1 text-xs font-semibold">
          Buscar
          <input name="q" defaultValue={params.q} placeholder="Clave o texto alternativo" className="h-10 rounded-md border border-border px-3 text-sm font-normal" />
        </label>
        <label className="grid gap-1 text-xs font-semibold">
          Tipo
          <select name="type" defaultValue={type} className="h-10 rounded-md border border-border px-3 text-sm font-normal">
            <option value="all">Todos</option>
            {types.map((contentType) => <option key={contentType} value={contentType}>{contentType}</option>)}
          </select>
        </label>
        <button className="self-end rounded-md border border-border px-5 py-2.5 text-sm font-semibold">Aplicar filtros</button>
      </form>
      {filtered.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((asset) => (
            <li key={asset.id} className="overflow-hidden rounded-lg border border-border bg-surface-raised">
              <div className="relative aspect-[4/3] bg-surface-sunken">
                <Image src={asset.url} alt={asset.altText ?? ""} fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-contain" unoptimized />
              </div>
              <div className="p-4">
                <p className="truncate text-xs text-text-muted" title={asset.storageKey}>{asset.storageKey}</p>
                <p className="mb-3 mt-1 text-xs text-text-subtle">
                  {asset.width && asset.height ? `${asset.width} × ${asset.height} · ` : ""}
                  {fileSize(asset.sizeBytes)} · {asset.createdAt.toLocaleDateString("es-CO")}
                </p>
                <MediaEditForm id={asset.id} altText={asset.altText ?? ""} />
                <MediaDeleteForm id={asset.id} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border-strong p-10 text-center text-sm text-text-muted">
          No hay archivos que coincidan con los filtros.
        </p>
      )}
    </>
  );
}
