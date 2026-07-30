import { money } from "@/domain/value-objects/money";
import type { ShippingRuleConfig, ShippingZoneNode } from "@/domain/services/shipping";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { shippingRules, shippingZones } from "@/infrastructure/db/schema";

/** Trae todo el árbol de zonas y sus reglas propias, mapeadas a la forma que consume resolveShippingQuote/resolveEffectiveZoneConfig. Usado tanto por el resolver de checkout como por el panel de administración, para que ambos partan exactamente de los mismos datos. */
export async function loadShippingTree(): Promise<{ zones: ShippingZoneNode[]; rules: ShippingRuleConfig[] }> {
  const db = await getRuntimeDb();
  const [zoneRows, ruleRows] = await Promise.all([db.select().from(shippingZones), db.select().from(shippingRules)]);

  const zones: ShippingZoneNode[] = zoneRows.map((z) => ({
    id: z.id,
    name: z.name,
    level: z.level,
    parentZoneId: z.parentZoneId,
    status: z.status,
  }));

  const rules: ShippingRuleConfig[] = ruleRows.map((r) => ({
    ruleId: r.id,
    zoneId: r.zoneId,
    fee: r.fee === null ? null : money(r.fee),
    freeShippingThreshold: r.freeShippingThreshold === null ? null : money(r.freeShippingThreshold),
    coverage: r.coverage,
    cashOnDeliveryAllowed: r.cashOnDeliveryAllowed,
    requiresAdvancePayment: r.requiresAdvancePayment,
    advancePercentage: r.advancePercentage,
    sameDayAvailable: r.sameDayAvailable,
    sameDayCutoffHour: r.sameDayCutoffHour,
    estimatedBusinessDaysMin: r.estimatedBusinessDaysMin,
    estimatedBusinessDaysMax: r.estimatedBusinessDaysMax,
    allowedPaymentMethods: r.allowedPaymentMethods,
    customerMessage: r.customerMessage,
  }));

  return { zones, rules };
}
