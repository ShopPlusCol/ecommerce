import { eq } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { settings } from "@/infrastructure/db/schema";

export type ShippingMessagesSettings = {
  noCoverageTemplate: string;
};

export const DEFAULT_SHIPPING_MESSAGES: ShippingMessagesSettings = {
  noCoverageTemplate: "Todavía no tenemos cobertura de envío hacia {lugar}.",
};

export async function getShippingMessagesSettings() {
  const db = await getRuntimeDb();
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "shipping_messages")).limit(1);
  return row?.value && typeof row.value === "object"
    ? { ...DEFAULT_SHIPPING_MESSAGES, ...(row.value as Partial<ShippingMessagesSettings>) }
    : DEFAULT_SHIPPING_MESSAGES;
}
