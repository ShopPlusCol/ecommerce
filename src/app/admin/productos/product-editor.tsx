"use client";

import { useActionState } from "react";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { updateProductDetailAction } from "./detail-actions";

type Option = { id: string; name: string };

export function ProductEditor({
  product,
  categories,
  collections,
  colorFamilies,
  selectedCategoryIds,
  selectedCollectionIds,
  media,
}: {
  product: Record<string, string | number | boolean | null>;
  categories: Option[];
  collections: Option[];
  colorFamilies: Option[];
  selectedCategoryIds: string[];
  selectedCollectionIds: string[];
  media: Array<{ url: string; altText: string }>;
}) {
  const [state, action, pending] = useActionState(updateProductDetailAction, INITIAL_ADMIN_ACTION_STATE);
  const input = "h-10 rounded-md border border-border bg-surface px-3 text-sm";
  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="id" value={String(product.id)} />
      <input type="hidden" name="updatedAt" value={String(product.updatedAt)} />
      <section className="grid gap-4 rounded-xl border border-border bg-surface-raised p-5 md:grid-cols-2">
        <h2 className="md:col-span-2">Información principal</h2>
        <label className="grid gap-1 text-sm font-medium">Nombre<input className={input} name="name" required defaultValue={String(product.name)} /></label>
        <label className="grid gap-1 text-sm font-medium">Slug<input className={input} name="slug" required defaultValue={String(product.slug)} /></label>
        <label className="grid gap-1 text-sm font-medium">SKU<input className={input} name="sku" required defaultValue={String(product.sku)} /></label>
        <label className="grid gap-1 text-sm font-medium">Estado<select className={input} name="status" defaultValue={String(product.status)}><option value="draft">Borrador</option><option value="active">Activo</option><option value="archived">Archivado</option></select></label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Descripción corta<textarea className="min-h-20 rounded-md border p-3" name="shortDescription" maxLength={240} defaultValue={String(product.shortDescription ?? "")} /></label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Descripción completa<textarea className="min-h-36 rounded-md border p-3" name="description" defaultValue={String(product.description ?? "")} /></label>
      </section>
      <section className="grid gap-4 rounded-xl border border-border bg-surface-raised p-5 md:grid-cols-3">
        <h2 className="md:col-span-3">Precio e inventario</h2>
        <label className="grid gap-1 text-sm font-medium">Precio COP<input className={input} name="price" type="number" min="0" required defaultValue={Number(product.price)} /></label>
        <label className="grid gap-1 text-sm font-medium">Precio comparativo<input className={input} name="compareAtPrice" type="number" min="0" defaultValue={product.compareAtPrice === null ? "" : Number(product.compareAtPrice)} /></label>
        <label className="grid gap-1 text-sm font-medium">Costo interno<input className={input} name="costPrice" type="number" min="0" defaultValue={product.costPrice === null ? "" : Number(product.costPrice)} /></label>
        <label className="grid gap-1 text-sm font-medium">Alerta de inventario<input className={input} name="lowStockThreshold" type="number" min="0" defaultValue={Number(product.lowStockThreshold)} /></label>
        <label className="grid gap-1 text-sm font-medium">Peso en gramos<input className={input} name="weightGrams" type="number" min="1" defaultValue={product.weightGrams === null ? "" : Number(product.weightGrams)} /></label>
        <label className="grid gap-1 text-sm font-medium">Orden<input className={input} name="order" type="number" defaultValue={Number(product.order)} /></label>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="allowBackorder" defaultChecked={Boolean(product.allowBackorder)} />Permitir venta sin existencias</label>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="featured" defaultChecked={Boolean(product.featured)} />Producto destacado</label>
      </section>
      <section className="grid gap-4 rounded-xl border border-border bg-surface-raised p-5 md:grid-cols-3">
        <h2 className="md:col-span-3">Organización</h2>
        <label className="grid gap-1 text-sm font-medium">Familia de color<select className={input} name="colorFamilyId" defaultValue={String(product.colorFamilyId ?? "")}><option value="">Sin familia</option>{colorFamilies.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-medium">Categorías<select className="min-h-32 rounded-md border p-2" name="categoryIds" multiple defaultValue={selectedCategoryIds}>{categories.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-medium">Colecciones<select className="min-h-32 rounded-md border p-2" name="collectionIds" multiple defaultValue={selectedCollectionIds}>{collections.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
      </section>
      <section className="grid gap-4 rounded-xl border border-border bg-surface-raised p-5 md:grid-cols-2">
        <h2 className="md:col-span-2">Imágenes y SEO</h2>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Imágenes (una por línea: URL | texto alternativo)<textarea className="min-h-36 rounded-md border p-3 font-mono text-sm" name="media" defaultValue={media.map((row) => `${row.url} | ${row.altText}`).join("\n")} /></label>
        <label className="grid gap-1 text-sm font-medium">Título SEO<input className={input} name="seoTitle" maxLength={120} defaultValue={String(product.seoTitle ?? "")} /></label>
        <label className="grid gap-1 text-sm font-medium">Descripción SEO<textarea className="min-h-20 rounded-md border p-3" name="seoDescription" maxLength={240} defaultValue={String(product.seoDescription ?? "")} /></label>
      </section>
      <button disabled={pending} className="h-12 rounded-md bg-brand px-6 font-semibold text-white disabled:opacity-60">{pending ? "Guardando…" : "Guardar producto completo"}</button>
      {state.status !== "idle" ? <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-danger" : "text-success"}>{state.message}</p> : null}
    </form>
  );
}
