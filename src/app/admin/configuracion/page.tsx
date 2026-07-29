import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getBrandSettings } from "@/modules/settings/brand";
import {
  saveBrandSettingsAction,
  saveManualTransferSettingsAction,
  savePrivacySettingsAction,
} from "./actions";
import { getManualTransferSettings } from "@/modules/settings/manual-transfer";
import { getPrivacySettings } from "@/modules/settings/privacy";

export const metadata: Metadata = { title: "Configuración" };

export default async function AdminSettingsPage() {
  const [brand, transfer, privacy] = await Promise.all([
    getBrandSettings(),
    getManualTransferSettings(),
    getPrivacySettings(),
  ]);
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
      <form action={savePrivacySettingsAction} className="mt-6 grid max-w-3xl gap-4 rounded-lg border border-border bg-surface-raised p-6 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Privacidad y retención</h2>
        <label className="text-sm font-medium">Versión de política
          <input type="date" name="policyVersion" defaultValue={privacy.policyVersion} required className="mt-1 w-full rounded-md border border-border bg-surface p-2" />
        </label>
        <label className="text-sm font-medium">Estado de revisión legal
          <select name="legalReviewStatus" defaultValue={privacy.legalReviewStatus} className="mt-1 w-full rounded-md border border-border bg-surface p-2">
            <option value="pending">Pendiente</option><option value="reviewed">Revisada por el negocio</option>
          </select>
        </label>
        <label className="text-sm font-medium">Responsable
          <input name="controllerName" defaultValue={privacy.controllerName} required className="mt-1 w-full rounded-md border border-border bg-surface p-2" />
        </label>
        <label className="text-sm font-medium">Identificación legal
          <input name="legalId" defaultValue={privacy.legalId} className="mt-1 w-full rounded-md border border-border bg-surface p-2" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">Domicilio
          <input name="address" defaultValue={privacy.address} className="mt-1 w-full rounded-md border border-border bg-surface p-2" />
        </label>
        <label className="text-sm font-medium sm:col-span-2">Correo de privacidad
          <input type="email" name="privacyEmail" defaultValue={privacy.privacyEmail} required className="mt-1 w-full rounded-md border border-border bg-surface p-2" />
        </label>
        {([
          ["orderRetentionMonths", "Retención de pedidos (meses)"],
          ["proofRetentionMonths", "Retención de comprobantes (meses)"],
          ["auditRetentionMonths", "Retención de auditoría (meses)"],
        ] as const).map(([name, label]) => (
          <label key={name} className="text-sm font-medium">{label}
            <input type="number" min="1" max="240" name={name} defaultValue={privacy[name]} required className="mt-1 w-full rounded-md border border-border bg-surface p-2" />
          </label>
        ))}
        <p className="text-sm text-text-muted sm:col-span-2">
          Marcar como revisada es una decisión del negocio; la aplicación no sustituye validación legal.
        </p>
        <button className="rounded-md bg-brand px-4 py-2 font-semibold text-white sm:col-span-2">Guardar privacidad</button>
      </form>
      <section className="mt-6 max-w-3xl rounded-lg border border-border bg-surface-raised p-6">
        <h2 className="font-semibold">Portabilidad de datos</h2>
        <p className="mt-2 text-sm text-text-muted">
          Descarga una instantánea JSON de negocio. No incluye credenciales, contraseñas, sesiones,
          webhooks ni archivos binarios.
        </p>
        <Link href="/api/admin/exports/data" className="mt-4 inline-flex rounded-md border border-border px-4 py-2 font-semibold">
          Exportar datos de negocio
        </Link>
      </section>
    </>
  );
}
