import type { ConversionEvent } from "@/application/ports/analytics-provider";
import {
  MetaConversionsProvider,
  type MetaRequestContext,
} from "@/infrastructure/analytics/meta-conversions-provider";
import { getServerMetaConfig } from "@/modules/analytics/meta-config";

export type MetaEventResult =
  | { ok: true; skipped?: "disabled" }
  | { ok: false; error: string };

/**
 * Punto único desde el que la aplicación envía un evento de servidor a
 * Meta. Resuelve la configuración (panel + variables de entorno), delega el
 * armado del evento en `MetaConversionsProvider` y **nunca lanza**: la
 * analítica no puede tumbar una compra, así que un fallo vuelve como
 * resultado para que quien llame lo registre y siga.
 */
export async function sendMetaServerEvent(
  event: ConversionEvent,
  context: MetaRequestContext = {},
): Promise<MetaEventResult> {
  const config = await getServerMetaConfig();
  if (!config.enabled) {
    // Integración desactivada o sin credenciales: no hay nada que enviar y
    // tampoco se finge un envío exitoso.
    return { ok: true, skipped: "disabled" };
  }

  const provider = new MetaConversionsProvider({
    pixelId: config.pixelId,
    accessToken: config.accessToken,
    apiVersion: config.apiVersion,
    testEventCode: config.testEventCode,
  });
  if (!provider.isEnabled()) return { ok: true, skipped: "disabled" };

  try {
    await provider.trackServerEvent(event, context);
    return { ok: true };
  } catch (error) {
    // Solo el mensaje del proveedor (código de estado), nunca el cuerpo de
    // la respuesta: puede repetir parámetros de la petición.
    return { ok: false, error: error instanceof Error ? error.message : "error de red" };
  }
}
