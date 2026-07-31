"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { deleteTryOnTextureAction, saveTryOnTextureAction } from "./actions";

type Texture = {
  id: string;
  textureUrl: string;
  baseSize: number;
  opacity: number;
  blendMode: "multiply" | "overlay" | "soft-light" | "source-over";
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  rotationOffset: number;
  perspectiveStrength: number;
  colorCorrection: { tint?: string; saturation?: number; brightness?: number };
  reviewStatus: "pending" | "approved" | "rejected";
} | null;

const controls = [
  ["baseSize", "Tamaño base", 60, 180],
  ["opacity", "Opacidad", 20, 100],
  ["scaleX", "Escala horizontal", 60, 180],
  ["scaleY", "Escala vertical", 60, 180],
  ["offsetX", "Posición horizontal", -20, 20],
  ["offsetY", "Posición vertical", -20, 20],
  ["rotationOffset", "Rotación", -45, 45],
  ["perspectiveStrength", "Perspectiva", -50, 50],
  ["saturation", "Saturación", 40, 180],
  ["brightness", "Brillo", 40, 180],
] as const;

export function TryOnTextureEditor({
  product,
  texture,
}: {
  product: { id: string; name: string; sku: string; slug: string };
  texture: Texture;
}) {
  const correction = texture?.colorCorrection ?? {};
  const [previewUrl, setPreviewUrl] = useState(texture?.textureUrl ?? "");
  const [values, setValues] = useState({
    baseSize: texture?.baseSize ?? 100,
    opacity: texture?.opacity ?? 85,
    scaleX: texture?.scaleX ?? 112,
    scaleY: texture?.scaleY ?? 106,
    offsetX: texture?.offsetX ?? 0,
    offsetY: texture?.offsetY ?? 0,
    rotationOffset: texture?.rotationOffset ?? 0,
    perspectiveStrength: texture?.perspectiveStrength ?? 0,
    saturation: correction.saturation ?? 100,
    brightness: correction.brightness ?? 100,
    tint: correction.tint ?? "#777777",
    blendMode: texture?.blendMode ?? "multiply",
    reviewStatus: texture?.reviewStatus ?? "pending",
  });
  const update = (name: string, value: string | number) => setValues((current) => ({ ...current, [name]: value }));
  const sizeX = 34 * (values.baseSize / 100) * (values.scaleX / 100);
  const sizeY = 34 * (values.baseSize / 100) * (values.scaleY / 100);
  const lensStyle = {
    width: sizeX,
    height: sizeY,
    opacity: values.opacity / 100,
    transform: `translate(${values.offsetX}px, ${values.offsetY}px) rotate(${values.rotationOffset}deg) skewX(${values.perspectiveStrength / 5}deg)`,
    filter: `saturate(${values.saturation}%) brightness(${values.brightness}%)`,
    mixBlendMode: values.blendMode === "source-over" ? "normal" : values.blendMode,
  } as React.CSSProperties;

  return (
    <section className="rounded-xl border border-border bg-surface-raised p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-semibold">{product.name}</h2><p className="text-sm text-text-muted">{product.sku}</p></div>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${texture?.reviewStatus === "approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
          {texture?.reviewStatus === "approved" ? "Activa en tienda" : texture?.reviewStatus === "rejected" ? "Rechazada" : texture ? "Borrador pendiente" : "Sin configurar"}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <figure><figcaption className="mb-2 text-xs font-semibold uppercase text-text-muted">Antes</figcaption><Image src="/demo/try-on-admin-demo.svg" alt="Rostro ilustrado local sin efecto" width={640} height={480} className="aspect-[4/3] w-full rounded-lg object-cover" /></figure>
        <figure><figcaption className="mb-2 text-xs font-semibold uppercase text-text-muted">Después · tiempo real</figcaption><div className="relative aspect-[4/3] overflow-hidden rounded-lg"><Image src="/demo/try-on-admin-demo.svg" alt="Previsualización ilustrada del efecto" fill className="object-cover" />{[40.6, 59.4].map((left) => <span key={left} className="absolute rounded-full border border-black/10" style={{ ...lensStyle, left: `${left}%`, top: "51%", marginLeft: -sizeX / 2, marginTop: -sizeY / 2, background: previewUrl ? `url(${previewUrl}) center/cover` : values.tint }} />)}</div></figure>
      </div>
      <form action={saveTryOnTextureAction} className="mt-5 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="productId" value={product.id} />
        <label className="text-sm font-semibold sm:col-span-2">Textura PNG/WebP<input type="file" name="texture" accept="image/png,image/webp" required={!texture} onChange={(event) => { const file = event.target.files?.[0]; if (file) setPreviewUrl(URL.createObjectURL(file)); }} className="mt-1 w-full rounded-md border border-border p-2" /></label>
        {controls.map(([name, label, min, max]) => <label key={name} className="text-sm font-semibold">{label}<div className="mt-1 flex items-center gap-2"><input className="w-full" type="range" min={min} max={max} value={Number(values[name])} onChange={(event) => update(name, Number(event.target.value))} /><input className="h-9 w-20 rounded-md border border-border px-2" type="number" name={name} min={min} max={max} value={Number(values[name])} onChange={(event) => update(name, Number(event.target.value))} /></div></label>)}
        <label className="text-sm font-semibold">Color de corrección<input className="mt-1 h-10 w-full" type="color" name="tint" value={values.tint} onChange={(event) => update("tint", event.target.value)} /></label>
        <label className="text-sm font-semibold">Mezcla<select className="mt-1 h-10 w-full rounded-md border border-border px-2" name="blendMode" value={values.blendMode} onChange={(event) => update("blendMode", event.target.value)}><option value="multiply">Multiplicar</option><option value="overlay">Superponer</option><option value="soft-light">Luz suave</option><option value="source-over">Normal</option></select></label>
        <label className="text-sm font-semibold sm:col-span-2">Estado<select className="mt-1 h-10 w-full rounded-md border border-border px-2" name="reviewStatus" value={values.reviewStatus} onChange={(event) => update("reviewStatus", event.target.value)}><option value="pending">Guardar como borrador</option><option value="approved">Aprobar y activar en tienda</option><option value="rejected">Rechazar</option></select></label>
        <div className="flex flex-wrap gap-2 sm:col-span-2"><button className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white">Guardar configuración</button>{texture?.reviewStatus === "approved" ? <Link href={`/productos/${product.slug}`} target="_blank" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold">Probar en tienda</Link> : null}</div>
      </form>
      {texture ? <form action={deleteTryOnTextureAction} className="mt-3"><input type="hidden" name="id" value={texture.id} /><button className="text-sm font-semibold text-danger underline">Eliminar textura y desactivar</button></form> : null}
    </section>
  );
}
