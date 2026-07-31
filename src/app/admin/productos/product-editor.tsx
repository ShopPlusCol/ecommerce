"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { uploadMediaInlineAction } from "@/app/admin/medios/actions";
import { INITIAL_ADMIN_ACTION_STATE } from "@/modules/admin/action-state";
import { isVideoUrl } from "@/lib/media-type";
import { updateProductDetailAction } from "./detail-actions";

type Option = { id: string; name: string };
type ProductImage = { url: string; altText: string };

export function ProductEditor({
  product,
  categories,
  collections,
  colorFamilies,
  selectedCategoryIds,
  selectedCollectionIds,
  media,
  availableMedia,
}: {
  product: Record<string, string | number | boolean | null>;
  categories: Option[];
  collections: Option[];
  colorFamilies: Option[];
  selectedCategoryIds: string[];
  selectedCollectionIds: string[];
  media: ProductImage[];
  availableMedia: ProductImage[];
}) {
  const [state, action, pending] = useActionState(updateProductDetailAction, INITIAL_ADMIN_ACTION_STATE);
  const [images, setImages] = useState<ProductImage[]>(media);
  const [libraryUrl, setLibraryUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const input = "h-10 rounded-md border border-border bg-surface px-3 text-sm";

  const addImage = (image: ProductImage) => {
    setImages((current) => current.some((row) => row.url === image.url) ? current : [...current, image]);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setUploadMessage("");
    const formData = new FormData();
    formData.set("file", file);
    formData.set("altText", String(product.name));
    const result = await uploadMediaInlineAction(formData);
    setUploading(false);
    setUploadMessage(result.message);
    if (result.status === "success") {
      addImage({ url: result.asset.url, altText: result.asset.altText || String(product.name) });
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    setImages((current) => {
      const copy = [...current];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

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
        <h2 className="md:col-span-2">Límite de venta cruzada</h2>
        <p className="text-sm text-text-muted md:col-span-2">Opcional. Limita cuántas unidades de este producto se pueden agregar según cuántas unidades de una categoría haya en el carrito (ej. máximo 1 solución por cada par de lentes). Deja ambos campos vacíos para no aplicar límite.</p>
        <label className="grid gap-1 text-sm font-medium">Categoría que habilita el límite<select className={input} name="limitCategoryId" defaultValue={String(product.limitCategoryId ?? "")}><option value="">Sin límite</option>{categories.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-medium">Unidades máximas por cada unidad de esa categoría<input className={input} name="maxUnitsPerCategoryUnit" type="number" min="0" defaultValue={product.maxUnitsPerCategoryUnit === null || product.maxUnitsPerCategoryUnit === undefined ? "" : Number(product.maxUnitsPerCategoryUnit)} /></label>
      </section>
      <section className="grid gap-4 rounded-xl border border-border bg-surface-raised p-5 md:grid-cols-2">
        <h2 className="md:col-span-2">Imágenes y SEO</h2>
        <div className="grid gap-3 rounded-lg border border-border p-4 md:col-span-2">
          <div>
            <h3 className="font-semibold">Galería del producto</h3>
            <p className="text-sm text-text-muted">El primer elemento (imagen o video) será la portada que se muestra en el catálogo y la tienda.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <select className={input} value={libraryUrl} onChange={(event) => setLibraryUrl(event.target.value)}>
              <option value="">Seleccionar de la biblioteca</option>
              {availableMedia.map((asset) => <option key={asset.url} value={asset.url}>{asset.altText || asset.url}</option>)}
            </select>
            <button
              type="button"
              onClick={() => {
                const selected = availableMedia.find((asset) => asset.url === libraryUrl);
                if (selected) addImage(selected);
              }}
              disabled={!libraryUrl}
              className="h-10 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-50"
            >
              Añadir a la galería
            </button>
          </div>
          <label className="flex items-center gap-2 rounded-md border border-dashed border-border-strong p-2 text-sm text-text-muted">
            {uploading ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : <ImagePlus className="h-4 w-4 shrink-0" />}
            <input
              ref={uploadRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/webm"
              disabled={uploading}
              onChange={async (event) => {
                const files = event.target.files ? Array.from(event.target.files) : [];
                for (const file of files) {
                  await uploadImage(file);
                }
              }}
              className="min-w-0 flex-1 text-sm file:mr-2 file:rounded file:border-0 file:bg-surface-sunken file:px-2 file:py-1 file:text-xs file:font-semibold disabled:opacity-60"
              aria-label="Subir imágenes o videos del producto"
            />
            <span className="shrink-0 text-xs">{uploading ? "Subiendo…" : "Imágenes o video (MP4/WebM, máx. 60 MB)"}</span>
          </label>
          {uploadMessage ? <p role="status" className="text-sm text-text-muted">{uploadMessage}</p> : null}
          {images.length ? (
            <div className="grid gap-2">
              {images.map((image, index) => (
                <div key={image.url} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
                  {isVideoUrl(image.url) ? (
                    <video src={image.url} muted playsInline preload="metadata" className="h-[72px] w-[72px] rounded-md border border-border object-cover" />
                  ) : (
                    <Image src={image.url} alt="" width={72} height={72} unoptimized className="h-[72px] w-[72px] rounded-md border border-border object-cover" />
                  )}
                  <label className="grid gap-1 text-xs font-semibold">
                    Texto alternativo{isVideoUrl(image.url) ? <span className="ml-1.5 rounded-full bg-surface-sunken px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Video</span> : null}
                    <input
                      value={image.altText}
                      onChange={(event) => setImages((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, altText: event.target.value } : row))}
                      className="h-10 rounded-md border border-border px-3 text-sm font-normal"
                      maxLength={180}
                    />
                  </label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Mover imagen hacia arriba" className="grid h-10 w-10 place-items-center rounded-md border border-border disabled:opacity-40"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} aria-label="Mover imagen hacia abajo" className="grid h-10 w-10 place-items-center rounded-md border border-border disabled:opacity-40"><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setImages((current) => current.filter((_, rowIndex) => rowIndex !== index))} aria-label="Quitar imagen del producto" className="grid h-10 w-10 place-items-center rounded-md border border-danger/30 text-danger"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-muted">Este producto todavía no tiene imágenes. Sube una para mostrarlo en la tienda.</p>}
          <input type="hidden" name="media" value={images.map((row) => `${row.url} | ${row.altText}`).join("\n")} />
        </div>
        <label className="grid gap-1 text-sm font-medium">Título SEO<input className={input} name="seoTitle" maxLength={120} defaultValue={String(product.seoTitle ?? "")} /></label>
        <label className="grid gap-1 text-sm font-medium">Descripción SEO<textarea className="min-h-20 rounded-md border p-3" name="seoDescription" maxLength={240} defaultValue={String(product.seoDescription ?? "")} /></label>
      </section>
      <button disabled={pending} className="h-12 rounded-md bg-brand px-6 font-semibold text-white disabled:opacity-60">{pending ? "Guardando…" : "Guardar producto completo"}</button>
      {state.status !== "idle" ? <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-danger" : "text-success"}>{state.message}</p> : null}
    </form>
  );
}
