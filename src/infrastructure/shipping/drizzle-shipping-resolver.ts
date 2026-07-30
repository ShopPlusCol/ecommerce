import type { ShippingDestination, ShippingRateResolver } from "@/application/ports/shipping-rate-resolver";
import type { Money } from "@/domain/value-objects/money";
import { money } from "@/domain/value-objects/money";
import { resolveShippingQuote, type ShippingRuleConfig, type ShippingZoneNode } from "@/domain/services/shipping";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { shippingRules, shippingZones } from "@/infrastructure/db/schema";

export class DrizzleShippingResolver implements ShippingRateResolver {
  async resolve(destination: ShippingDestination, cartTotal: Money) {
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

    return resolveShippingQuote(zones, rules, destination, cartTotal);
  }
}
