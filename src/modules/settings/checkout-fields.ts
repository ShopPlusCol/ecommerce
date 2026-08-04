import { eq } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { settings } from "@/infrastructure/db/schema";
import { parseCheckoutFieldsConfig, type CheckoutFieldConfig } from "@/modules/checkout/checkout-fields";
import { logger } from "@/modules/observability/logger";

export type { CheckoutFieldConfig, CheckoutFieldId } from "@/modules/checkout/checkout-fields";

/**
 * Única puerta de lectura de `checkout_fields`: valida con
 * `parseCheckoutFieldsConfig` (el mismo esquema que usa el guardado) y cae
 * a la configuración segura por defecto si el registro almacenado no
 * calza — nunca deja que un JSON corrupto o de una versión anterior rompa
 * el checkout o quede con reglas incoherentes.
 */
export async function getCheckoutFieldsSettings(): Promise<CheckoutFieldConfig[]> {
  const db = await getRuntimeDb();
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "checkout_fields")).limit(1);
  if (!row?.value) return parseCheckoutFieldsConfig(undefined).fields;
  const { fields, usedFallback, issues } = parseCheckoutFieldsConfig(row.value);
  if (usedFallback) {
    logger.warn("checkout_fields.settings.invalid", { issues, raw: row.value });
  }
  return fields;
}
