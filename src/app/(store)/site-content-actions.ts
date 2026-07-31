"use server";

import { getBrandSettings, type BrandSettings } from "@/modules/settings/brand";
import { getSiteTextsSettings, type SiteTextsSettings } from "@/modules/settings/site-texts";
import { getCheckoutFieldsSettings, type CheckoutFieldConfig } from "@/modules/settings/checkout-fields";

/** Marca y textos del sitio, editables desde Configuración, para componentes de cliente que no reciben esos datos como prop desde el layout. */
export async function getStoreContentAction(): Promise<{ brand: BrandSettings; texts: SiteTextsSettings }> {
  const [brand, texts] = await Promise.all([getBrandSettings(), getSiteTextsSettings()]);
  return { brand, texts };
}

/** Qué campos del checkout están activos, cuáles son obligatorios y en qué orden — editable desde Configuración → Formulario de checkout. */
export async function getCheckoutFieldsAction(): Promise<CheckoutFieldConfig[]> {
  return getCheckoutFieldsSettings();
}
