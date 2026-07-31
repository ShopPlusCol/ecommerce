import { eq } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { settings } from "@/infrastructure/db/schema";
import { DEFAULT_CHECKOUT_FIELDS, type CheckoutFieldConfig } from "@/modules/checkout/checkout-fields";

export type { CheckoutFieldConfig, CheckoutFieldId } from "@/modules/checkout/checkout-fields";

export async function getCheckoutFieldsSettings(): Promise<CheckoutFieldConfig[]> {
  const db = await getRuntimeDb();
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "checkout_fields")).limit(1);
  const stored = row?.value && Array.isArray(row.value) ? (row.value as CheckoutFieldConfig[]) : null;
  if (!stored) return DEFAULT_CHECKOUT_FIELDS;
  // Por si se agregan campos nuevos en el futuro que el registro guardado no conoce todavía.
  const byId = new Map(stored.map((field) => [field.id, field]));
  return DEFAULT_CHECKOUT_FIELDS.map((defaultField) => byId.get(defaultField.id) ?? defaultField).sort((a, b) => a.order - b.order);
}
