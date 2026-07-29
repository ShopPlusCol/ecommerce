import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { integrationSettings } from "@/infrastructure/db/schema";
import { IntegrationForm } from "./integration-form";

const definitions = [
  { provider: "mercado_pago", name: "Mercado Pago", variables: ["MERCADO_PAGO_ACCESS_TOKEN", "MERCADO_PAGO_TEST_MODE"], configurable: true },
  { provider: "meta_conversions_api", name: "Meta Pixel y Conversions API", variables: ["META_PIXEL_ID", "META_CONVERSIONS_ACCESS_TOKEN"], configurable: true },
  { provider: "smtp", name: "Correo SMTP", variables: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"], configurable: true },
  { provider: "r2", name: "Cloudflare R2", variables: ["R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"], configurable: false },
  { provider: "d1", name: "Cloudflare D1", variables: ["DB (binding)"], configurable: false },
  { provider: "worker", name: "Cloudflare Worker", variables: ["CLOUDFLARE_WORKER", "APP_REVISION"], configurable: false },
] as const;

function envState(provider: string) {
  if (provider === "mercado_pago") return Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN);
  if (provider === "meta_conversions_api") return Boolean(process.env.META_PIXEL_ID && process.env.META_CONVERSIONS_ACCESS_TOKEN);
  if (provider === "smtp") return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  if (provider === "r2") return Boolean(process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
  if (provider === "d1") return Boolean(process.env.CLOUDFLARE_WORKER);
  return Boolean(process.env.CLOUDFLARE_WORKER);
}

export default async function Page() {
  await requirePermission("integrations", "read");
  const rows = await (await getRuntimeDb()).select().from(integrationSettings);
  return <><AdminPageHeader title="Integraciones" description="Estado operativo sin mostrar secretos. Los diagnósticos locales nunca se presentan como pruebas del proveedor." /><div className="grid gap-4 lg:grid-cols-2">{definitions.map((definition) => {
    const row = rows.find((item) => item.provider === definition.provider);
    const configured = envState(definition.provider);
    const metadata = row?.metadata as { missingVariables?: string[]; note?: string } | null;
    return <section key={definition.provider} className="rounded-xl border border-border bg-surface-raised p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{definition.name}</h2><p className="mt-1 text-sm text-text-muted">{definition.variables.join(" · ")}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${configured ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{configured ? "Variables presentes" : "Configuración pendiente"}</span></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-text-muted">Estado</dt><dd className="font-semibold">{row?.isEnabled ? "Activa" : "Inactiva"}</dd></div><div><dt className="text-text-muted">Modo</dt><dd className="font-semibold">{row?.isTestMode !== false ? "Prueba" : "Producción"}</dd></div><div className="col-span-2"><dt className="text-text-muted">Última comprobación</dt><dd>{row?.lastCheckedAt?.toLocaleString("es-CO") ?? "Sin comprobar"}</dd></div>{metadata?.missingVariables?.length ? <div className="col-span-2"><dt className="text-text-muted">Faltantes</dt><dd className="text-danger">{metadata.missingVariables.join(", ")}</dd></div> : null}</dl>{definition.configurable ? <IntegrationForm provider={definition.provider} enabled={row?.isEnabled ?? false} testMode={row?.isTestMode ?? true} /> : <p className="mt-4 rounded-lg bg-info-soft p-3 text-sm">Se prepara localmente y requiere crear o vincular el recurso externo con autorización. No se ha probado conectividad.</p>}</section>;
  })}</div></>;
}
