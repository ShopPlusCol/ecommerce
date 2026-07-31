import { eq } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { settings } from "@/infrastructure/db/schema";
import { DEFAULT_PAYMENT_METHOD_COPY, type PaymentMethodCopy, type PaymentMethodId } from "@/domain/services/payments";

export type { PaymentMethodCopy };
export type PaymentMethodsSettings = Record<PaymentMethodId, PaymentMethodCopy>;
export const DEFAULT_PAYMENT_METHODS_SETTINGS: PaymentMethodsSettings = DEFAULT_PAYMENT_METHOD_COPY;

export async function getPaymentMethodsSettings(): Promise<PaymentMethodsSettings> {
  const db = await getRuntimeDb();
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "payment_methods")).limit(1);
  if (!row?.value || typeof row.value !== "object") return DEFAULT_PAYMENT_METHODS_SETTINGS;
  const stored = row.value as Partial<PaymentMethodsSettings>;
  const merged = {} as PaymentMethodsSettings;
  for (const id of Object.keys(DEFAULT_PAYMENT_METHODS_SETTINGS) as PaymentMethodId[]) {
    merged[id] = { ...DEFAULT_PAYMENT_METHODS_SETTINGS[id], ...stored[id] };
  }
  return merged;
}
