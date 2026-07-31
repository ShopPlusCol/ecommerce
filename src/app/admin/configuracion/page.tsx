import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { mediaAssets } from "@/infrastructure/db/schema";
import { getBrandSettings } from "@/modules/settings/brand";
import { getManualTransferSettings } from "@/modules/settings/manual-transfer";
import { getPrivacySettings } from "@/modules/settings/privacy";
import { getShippingMessagesSettings } from "@/modules/settings/shipping-messages";
import { getPaymentMethodsSettings } from "@/modules/settings/payment-methods";
import { BrandSettingsForm, ManualTransferSettingsForm, PrivacySettingsForm, ShippingMessagesSettingsForm, PaymentMethodsSettingsForm } from "./config-forms";

export const metadata: Metadata = { title: "Configuración" };

export default async function AdminSettingsPage() {
  const [brand, transfer, privacy, shippingMessages, paymentMethods, media] = await Promise.all([
    getBrandSettings(),
    getManualTransferSettings(),
    getPrivacySettings(),
    getShippingMessagesSettings(),
    getPaymentMethodsSettings(),
    (await getRuntimeDb()).select().from(mediaAssets),
  ]);
  const assets = media.map((asset) => ({ url: asset.url, label: asset.altText || asset.storageKey }));
  return (
    <>
      <AdminPageHeader title="Configuración" description="Identidad, recursos visuales, pagos, privacidad y portabilidad organizados para operación diaria." />
      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Secciones de configuración">
        <a href="#marca" className="rounded-md border border-border px-3 py-2 text-sm font-semibold">Marca</a>
        <a href="#pagos" className="rounded-md border border-border px-3 py-2 text-sm font-semibold">Transferencias</a>
        <a href="#metodos-pago" className="rounded-md border border-border px-3 py-2 text-sm font-semibold">Métodos de pago</a>
        <a href="#envios" className="rounded-md border border-border px-3 py-2 text-sm font-semibold">Envíos</a>
        <a href="#privacidad" className="rounded-md border border-border px-3 py-2 text-sm font-semibold">Privacidad</a>
        <a href="#datos" className="rounded-md border border-border px-3 py-2 text-sm font-semibold">Datos</a>
      </nav>
      <BrandSettingsForm brand={brand} assets={assets} />
      <ManualTransferSettingsForm transfer={transfer} assets={assets} />
      <PaymentMethodsSettingsForm paymentMethods={paymentMethods} />
      <ShippingMessagesSettingsForm shippingMessages={shippingMessages} />
      <PrivacySettingsForm privacy={privacy} />
      <section id="datos" className="mt-6 max-w-5xl rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold">Portabilidad de datos</h2>
        <p className="mt-2 text-sm text-text-muted">Descarga una instantánea JSON del negocio. Excluye credenciales, contraseñas, sesiones, webhooks y archivos binarios.</p>
        <Link href="/api/admin/exports/data" className="mt-4 inline-flex rounded-md border border-border px-4 py-2 font-semibold">Exportar datos de negocio</Link>
      </section>
    </>
  );
}
