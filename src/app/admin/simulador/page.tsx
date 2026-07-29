import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { products, tryOnTextures } from "@/infrastructure/db/schema";
import { requirePermission } from "@/modules/auth/session";
import { TryOnTextureEditor } from "./try-on-texture-editor";

export const metadata: Metadata = { title: "Simulador" };

export default async function AdminTryOnPage() {
  await requirePermission("catalog", "read");
  const rows = await (await getRuntimeDb()).select({ product: products, texture: tryOnTextures }).from(products).leftJoin(tryOnTextures, eq(tryOnTextures.productId, products.id)).orderBy(asc(products.name));
  const lenses = rows.filter(({ product }) => product.sku.startsWith("SPC-LEN"));
  return <><AdminPageHeader title="Simulador por fotografía" description="Calibra cada textura en tiempo real con una imagen local, aprueba y comprueba el resultado en la tienda." /><div className="mb-5 rounded-xl border border-info/30 bg-info-soft p-4 text-sm">La imagen de demostración no representa a una persona real. Las fotos de clientes se procesan localmente y nunca aparecen en este panel.</div>{lenses.length ? <div className="grid gap-5 xl:grid-cols-2">{lenses.map(({ product, texture }) => <TryOnTextureEditor key={product.id} product={{ id: product.id, name: product.name, sku: product.sku, slug: product.slug }} texture={texture} />)}</div> : <div className="rounded-xl border border-dashed border-border-strong p-10 text-center"><h2 className="font-semibold">No hay lentes compatibles</h2><p className="mt-1 text-sm text-text-muted">Crea productos con SKU SPC-LEN para configurar el simulador.</p></div>}</>;
}
