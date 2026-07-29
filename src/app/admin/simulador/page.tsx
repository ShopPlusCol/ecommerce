import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { products, tryOnTextures } from "@/infrastructure/db/schema";
import { requirePermission } from "@/modules/auth/session";
import { deleteTryOnTextureAction, saveTryOnTextureAction } from "./actions";

export const metadata: Metadata = { title: "Simulador" };

export default async function AdminTryOnPage() {
  await requirePermission("catalog", "read");
  const db = await getRuntimeDb();
  const rows = await db
    .select({ product: products, texture: tryOnTextures })
    .from(products)
    .leftJoin(tryOnTextures, eq(tryOnTextures.productId, products.id))
    .orderBy(asc(products.name));
  const lenses = rows.filter(({ product }) => product.sku.startsWith("SPC-LEN"));

  return (
    <>
      <AdminPageHeader
        title="Simulador por fotografía"
        description="Prepara y aprueba una textura por tono. La foto de la clienta nunca llega a este panel."
      />
      <div className="mb-5 rounded-lg border border-info bg-info-soft p-4 text-sm text-text">
        Usa un PNG o WebP cuadrado, transparente, sin pupila sólida y con borde difuminado. Vista previa el resultado
        en una foto de prueba sin datos personales antes de aprobarlo.
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {lenses.map(({ product, texture }) => {
          const correction = texture?.colorCorrection ?? {};
          return (
            <section key={product.id} className="rounded-xl border border-border bg-surface-raised p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">{product.name}</h2>
                  <p className="text-sm text-text-muted">{product.sku}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    texture?.reviewStatus === "approved"
                      ? "bg-success-soft text-success"
                      : texture?.reviewStatus === "rejected"
                        ? "bg-danger-soft text-danger"
                        : "bg-warning-soft text-warning"
                  }`}
                >
                  {texture?.reviewStatus ?? "sin configurar"}
                </span>
              </div>

              <form action={saveTryOnTextureAction} className="mt-4 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="productId" value={product.id} />
                <label className="sm:col-span-2 text-sm">
                  <span className="mb-1 block font-medium">Textura PNG/WebP</span>
                  <input
                    type="file"
                    name="texture"
                    accept="image/png,image/webp"
                    required={!texture}
                    className="w-full rounded-md border border-border p-2"
                  />
                  <span className="mt-1 block text-xs text-text-muted">Máximo 2 MB; entre 256 y 2048 px.</span>
                </label>
                {[
                  ["baseSize", "Tamaño base", texture?.baseSize ?? 100, 60, 180],
                  ["opacity", "Opacidad", texture?.opacity ?? 85, 20, 100],
                  ["scaleX", "Escala horizontal", texture?.scaleX ?? 112, 60, 180],
                  ["scaleY", "Escala vertical", texture?.scaleY ?? 106, 60, 180],
                  ["rotationOffset", "Rotación", texture?.rotationOffset ?? 0, -45, 45],
                  ["perspectiveStrength", "Perspectiva", texture?.perspectiveStrength ?? 0, -50, 50],
                  ["saturation", "Saturación", correction.saturation ?? 100, 40, 180],
                  ["brightness", "Brillo", correction.brightness ?? 100, 40, 180],
                ].map(([name, label, value, min, max]) => (
                  <label key={String(name)} className="text-sm">
                    <span className="mb-1 block font-medium">{label}</span>
                    <input
                      type="number"
                      name={String(name)}
                      defaultValue={value}
                      min={min}
                      max={max}
                      required
                      className="w-full rounded-md border border-border p-2"
                    />
                  </label>
                ))}
                <label className="text-sm">
                  <span className="mb-1 block font-medium">Color de corrección</span>
                  <input
                    type="color"
                    name="tint"
                    defaultValue={correction.tint ?? "#777777"}
                    className="h-11 w-full rounded-md border border-border p-1"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium">Mezcla</span>
                  <select name="blendMode" defaultValue={texture?.blendMode ?? "multiply"} className="w-full rounded-md border border-border p-2">
                    <option value="multiply">Multiplicar</option>
                    <option value="overlay">Superponer</option>
                    <option value="soft-light">Luz suave</option>
                    <option value="source-over">Normal</option>
                  </select>
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium">Estado de revisión</span>
                  <select name="reviewStatus" defaultValue={texture?.reviewStatus ?? "pending"} className="w-full rounded-md border border-border p-2">
                    <option value="pending">Pendiente</option>
                    <option value="approved">Aprobada</option>
                    <option value="rejected">Rechazada</option>
                  </select>
                </label>
                <button className="rounded-md bg-brand px-4 py-2 font-semibold text-brand-contrast sm:col-span-2">
                  Guardar textura
                </button>
              </form>
              {texture ? (
                <form action={deleteTryOnTextureAction} className="mt-3">
                  <input type="hidden" name="id" value={texture.id} />
                  <button className="text-sm font-medium text-danger underline">Eliminar textura y archivo</button>
                </form>
              ) : null}
            </section>
          );
        })}
      </div>
    </>
  );
}
