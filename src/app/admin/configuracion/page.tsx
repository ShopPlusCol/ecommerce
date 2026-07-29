import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getBrandSettings } from "@/modules/settings/brand";
import { saveBrandSettingsAction } from "./actions";
import { saveManualTransferSettingsAction } from "./actions";
import { getManualTransferSettings } from "@/modules/settings/manual-transfer";

export const metadata: Metadata = { title: "Configuración" };

export default async function AdminSettingsPage() {
  const [brand, transfer] = await Promise.all([getBrandSettings(), getManualTransferSettings()]);
  const fields = [
    ["name", "Nombre visible"], ["tagline", "Tagline"], ["description", "Descripción"],
    ["logoUrl", "URL logo principal"], ["mobileLogoUrl", "URL logo móvil"],
    ["footerLogoUrl", "URL logo footer"], ["faviconUrl", "URL favicon"],
    ["appleTouchIconUrl", "URL Apple Touch Icon"], ["openGraphImageUrl", "URL imagen Open Graph"],
    ["altText", "Texto alternativo"], ["email", "Correo"], ["whatsapp", "WhatsApp"],
    ["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"],
  ] as const;
  return (
    <>
      <AdminPageHeader title="Configuración" description="Identidad y canales públicos persistidos." />
      <form action={saveBrandSettingsAction} className="grid max-w-3xl gap-4 rounded-lg border border-border bg-surface-raised p-6 sm:grid-cols-2">
        <label className="text-sm font-medium">Modo de marca
          <select name="mode" defaultValue={brand.mode} className="mt-1 w-full rounded-md border border-border bg-surface p-2">
            <option value="text">Texto</option><option value="image">Imagen</option><option value="image_text">Imagen y texto</option>
          </select>
        </label>
        {fields.map(([name, label]) => (
          <label key={name} className="text-sm font-medium">{label}
            <input name={name} defaultValue={brand[name] ?? ""} className="mt-1 w-full rounded-md border border-border bg-surface p-2" />
          </label>
        ))}
        <button className="rounded-md bg-brand px-4 py-2 font-semibold text-white sm:col-span-2">Guardar configuración</button>
      </form>
      <form action={saveManualTransferSettingsAction} className="mt-6 grid max-w-3xl gap-4 rounded-lg border border-border bg-surface-raised p-6 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Transferencia manual</h2>
        {([["bankName", "Banco"], ["accountType", "Tipo de cuenta"], ["accountNumber", "Número"], ["accountHolder", "Titular"], ["qrUrl", "URL del QR"], ["instructions", "Instrucciones"]] as const).map(([name, label]) => <label key={name} className="text-sm font-medium">{label}<input name={name} defaultValue={transfer[name] ?? ""} className="mt-1 w-full rounded-md border border-border bg-surface p-2" /></label>)}
        <button className="rounded-md bg-brand px-4 py-2 font-semibold text-white sm:col-span-2">Guardar transferencia</button>
      </form>
    </>
  );
}
