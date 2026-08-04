import { cache } from "react";
import { eq } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { integrationSettings } from "@/infrastructure/db/schema";

/**
 * Configuración de Meta que sí puede viajar al navegador. El ID de píxel es
 * público por naturaleza (aparece en el propio script de Meta), pero el
 * token de la Conversions API **nunca** sale del servidor: no está en este
 * tipo a propósito, para que no exista forma de filtrarlo por descuido a un
 * componente de cliente.
 */
export type PublicMetaConfig = {
  pixelId: string | null;
  /** true solo si hay píxel configurado y la integración está activa en el panel. */
  enabled: boolean;
};

/** Configuración completa, solo para uso en servidor (Conversions API). */
export type ServerMetaConfig = PublicMetaConfig & {
  accessToken: string | null;
  apiVersion: string;
  /** Código de evento de prueba de Events Manager; si está, los eventos van marcados como test. */
  testEventCode: string | null;
  testMode: boolean;
};

const DEFAULT_API_VERSION = "v21.0";

/**
 * Estado de la integración según el panel (`/admin/integraciones`) más las
 * variables de entorno. El panel decide si está activa; las variables
 * aportan las credenciales. Sin credenciales la integración queda
 * desactivada aunque el panel diga lo contrario — así el sistema queda
 * listo pero nunca finge eventos exitosos.
 */
export const getServerMetaConfig = cache(async function getServerMetaConfig(): Promise<ServerMetaConfig> {
  const pixelId = process.env.META_PIXEL_ID?.trim() || null;
  const accessToken = process.env.META_CONVERSIONS_ACCESS_TOKEN?.trim() || null;
  const apiVersion = process.env.META_GRAPH_API_VERSION?.trim() || DEFAULT_API_VERSION;
  const testEventCode = process.env.META_TEST_EVENT_CODE?.trim() || null;

  let isEnabled = false;
  let testMode = true;
  try {
    const db = await getRuntimeDb();
    const [row] = await db
      .select({ isEnabled: integrationSettings.isEnabled, isTestMode: integrationSettings.isTestMode })
      .from(integrationSettings)
      .where(eq(integrationSettings.provider, "meta_conversions_api"))
      .limit(1);
    isEnabled = row?.isEnabled ?? false;
    testMode = row?.isTestMode ?? true;
  } catch {
    // Sin fila de integración (o sin base disponible) la respuesta segura
    // es "desactivada", no "activada por defecto".
    isEnabled = false;
  }

  return {
    pixelId,
    enabled: Boolean(isEnabled && pixelId),
    accessToken,
    apiVersion,
    testEventCode,
    testMode,
  };
});

/** Versión reducida que puede pasarse a componentes de cliente. */
export async function getPublicMetaConfig(): Promise<PublicMetaConfig> {
  const config = await getServerMetaConfig();
  return { pixelId: config.pixelId, enabled: config.enabled };
}
