import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { integrationSettings } from "@/infrastructure/db/schema";
import { getCloudflareEnv } from "@/infrastructure/cloudflare/env";
import { IntegrationForm } from "./integration-form";

const definitions = [
  {
    provider: "mercado_pago",
    name: "Mercado Pago",
    variables: ["MERCADO_PAGO_ACCESS_TOKEN", "MERCADO_PAGO_WEBHOOK_SECRET", "MERCADO_PAGO_TEST_MODE"],
    configurable: true,
    howTo: [
      "Entra a tu cuenta de Mercado Pago → Tu negocio → Configuración → Credenciales, y copia el Access Token y el secreto de notificaciones (webhook) de la aplicación.",
      "En desarrollo local: pégalos en tu archivo .env.local como MERCADO_PAGO_ACCESS_TOKEN y MERCADO_PAGO_WEBHOOK_SECRET.",
      "En el sitio ya desplegado en Cloudflare: panel de Cloudflare → Workers & Pages → tu Worker → Settings → Variables and Secrets → Add variable, marcando cada uno como \"Secret\" (no \"Text\"). MERCADO_PAGO_TEST_MODE no es secreto — déjalo en \"true\" para probar con tarjetas de prueba antes de cobrar de verdad.",
      "Los secretos nunca se pegan aquí ni en ningún chat: este panel solo activa/desactiva la integración y confirma si las variables ya existen en el servidor.",
    ],
  },
  {
    provider: "meta_conversions_api",
    name: "Meta Pixel y Conversions API",
    variables: ["META_PIXEL_ID", "META_CONVERSIONS_ACCESS_TOKEN"],
    configurable: true,
    howTo: [
      "Consigue el ID de píxel y el token de acceso de la API de Conversiones desde Meta Events Manager (Orígenes de datos → tu píxel → Configuración).",
      "Mismo mecanismo que Mercado Pago: META_PIXEL_ID puede ir como variable normal; META_CONVERSIONS_ACCESS_TOKEN debe cargarse como Secret (local: .env.local; desplegado: Cloudflare → Settings → Variables and Secrets).",
      "Mantenla desactivada hasta tener consentimiento de cookies/analítica confirmado en el sitio.",
    ],
  },
  {
    provider: "smtp",
    name: "Correo SMTP",
    variables: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"],
    configurable: true,
    howTo: [
      "Usa las credenciales SMTP de tu proveedor de correo (p. ej. el servicio transaccional que uses para enviar recuperación de contraseña).",
      "SMTP_HOST, SMTP_PORT y SMTP_USER pueden ir como variables normales; SMTP_PASSWORD debe cargarse como Secret, igual que los anteriores.",
    ],
  },
  {
    provider: "r2",
    name: "Cloudflare R2 (multimedia)",
    variables: ["MEDIA_BUCKET (binding)", "NEXT_INC_CACHE_R2_BUCKET (binding)"],
    configurable: false,
    howTo: [
      "No se configura con variables de entorno ni desde este panel: se crea el bucket con `wrangler r2 bucket create` y se vincula en wrangler.jsonc antes de desplegar (ver docs/DEPLOYMENT.md → \"Integraciones externas\").",
    ],
  },
  {
    provider: "d1",
    name: "Cloudflare D1 (base de datos)",
    variables: ["DB (binding)"],
    configurable: false,
    howTo: [
      "Se crea con `wrangler d1 create` y se vincula pegando el database_id real en wrangler.jsonc antes de desplegar — hoy sigue con un valor de ejemplo (REPLACE_WITH_REAL_D1_DATABASE_ID), así que el sitio todavía no se ha desplegado a producción en Cloudflare.",
    ],
  },
  {
    provider: "worker",
    name: "Cloudflare Worker",
    variables: ["CLOUDFLARE_WORKER", "APP_REVISION"],
    configurable: false,
    howTo: ["Se activa automáticamente al desplegar con `npm run cf:deploy`; no requiere ninguna acción manual aparte."],
  },
] as const;

export default async function Page() {
  await requirePermission("integrations", "read");
  const [rows, cfEnv] = await Promise.all([
    (await getRuntimeDb()).select().from(integrationSettings),
    getCloudflareEnv(),
  ]);

  function envState(provider: string): boolean {
    if (provider === "mercado_pago") return Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN && process.env.MERCADO_PAGO_WEBHOOK_SECRET);
    if (provider === "meta_conversions_api") return Boolean(process.env.META_PIXEL_ID && process.env.META_CONVERSIONS_ACCESS_TOKEN);
    if (provider === "smtp") return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    if (provider === "r2") return Boolean(cfEnv?.MEDIA_BUCKET);
    if (provider === "d1") return Boolean(cfEnv?.DB);
    return Boolean(process.env.CLOUDFLARE_WORKER);
  }

  return (
    <>
      <AdminPageHeader
        title="Integraciones"
        description="Estado operativo sin mostrar secretos. Los diagnósticos locales nunca se presentan como pruebas del proveedor."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {definitions.map((definition) => {
          const row = rows.find((item) => item.provider === definition.provider);
          const configured = envState(definition.provider);
          const metadata = row?.metadata as { missingVariables?: string[]; note?: string } | null;
          return (
            <section key={definition.provider} className="rounded-xl border border-border bg-surface-raised p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{definition.name}</h2>
                  <p className="mt-1 text-sm text-text-muted">{definition.variables.join(" · ")}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${configured ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                  {configured ? "Variables presentes" : "Configuración pendiente"}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-text-muted">Estado</dt>
                  <dd className="font-semibold">{row?.isEnabled ? "Activa" : "Inactiva"}</dd>
                </div>
                <div>
                  <dt className="text-text-muted">Modo</dt>
                  <dd className="font-semibold">{row?.isTestMode !== false ? "Prueba" : "Producción"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-text-muted">Última comprobación</dt>
                  <dd>{row?.lastCheckedAt?.toLocaleString("es-CO") ?? "Sin comprobar"}</dd>
                </div>
                {metadata?.missingVariables?.length ? (
                  <div className="col-span-2">
                    <dt className="text-text-muted">Faltantes</dt>
                    <dd className="text-danger">{metadata.missingVariables.join(", ")}</dd>
                  </div>
                ) : null}
              </dl>

              <details className="mt-4 rounded-lg border border-border bg-surface-sunken/60 p-3 text-sm">
                <summary className="cursor-pointer font-semibold text-brand">Cómo configurarlo</summary>
                <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-text-muted">
                  {definition.howTo.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </details>

              {definition.configurable ? (
                <IntegrationForm provider={definition.provider} enabled={row?.isEnabled ?? false} testMode={row?.isTestMode ?? true} />
              ) : (
                <p className="mt-4 rounded-lg bg-info-soft p-3 text-sm">
                  Se prepara localmente y requiere crear o vincular el recurso externo con autorización. No se ha probado conectividad.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
