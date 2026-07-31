"use server";

import { getBrandSettings, type BrandSettings } from "@/modules/settings/brand";
import { getSiteTextsSettings, type SiteTextsSettings } from "@/modules/settings/site-texts";

/** Marca y textos del sitio, editables desde Configuración, para componentes de cliente que no reciben esos datos como prop desde el layout. */
export async function getStoreContentAction(): Promise<{ brand: BrandSettings; texts: SiteTextsSettings }> {
  const [brand, texts] = await Promise.all([getBrandSettings(), getSiteTextsSettings()]);
  return { brand, texts };
}
