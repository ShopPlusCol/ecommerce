import { eq } from "drizzle-orm";
import type { ShippingDestination, ShippingRateResolver } from "@/application/ports/shipping-rate-resolver";
import type { Money } from "@/domain/value-objects/money";
import { money } from "@/domain/value-objects/money";
import { resolveShippingQuote, type ShippingRuleWithZone } from "@/domain/services/shipping";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { shippingRules, shippingZones } from "@/infrastructure/db/schema";

export class DrizzleShippingResolver implements ShippingRateResolver {
  async resolve(destination: ShippingDestination, cartTotal: Money) {
    const db = await getRuntimeDb();
    const rows = await db
      .select({ rule: shippingRules, zone: shippingZones })
      .from(shippingRules)
      .innerJoin(shippingZones, eq(shippingZones.id, shippingRules.zoneId));
    const now = Date.now();
    const rules: ShippingRuleWithZone[] = rows
      .filter(({ rule, zone }) => zone.status === "active" && (!rule.startsAt || rule.startsAt.getTime() <= now) && (!rule.endsAt || rule.endsAt.getTime() >= now))
      .map(({ rule, zone }) => ({
        ruleId: rule.id,
        zone: { level: zone.level, country: zone.country, department: zone.department, city: zone.city, neighborhood: zone.neighborhood },
        fee: money(rule.fee + rule.surcharge),
        freeShippingThreshold: rule.freeShippingThreshold === null ? null : money(rule.freeShippingThreshold),
        cashOnDeliveryAllowed: rule.cashOnDeliveryAllowed,
        requiresAdvancePayment: rule.requiresAdvancePayment,
        advancePercentage: rule.advancePercentage,
        estimatedBusinessDaysMin: rule.estimatedBusinessDaysMin,
        estimatedBusinessDaysMax: rule.estimatedBusinessDaysMax,
        sameDayCutoffHour: rule.sameDayCutoffHour,
        customerMessage: rule.customerMessage ?? "",
        minOrderAmount: rule.minOrderAmount === null ? null : money(rule.minOrderAmount),
        maxOrderAmount: rule.maxOrderAmount === null ? null : money(rule.maxOrderAmount),
        allowedPaymentMethods: rule.allowedPaymentMethods,
        priority: rule.priority,
        status: rule.status,
      }));
    return resolveShippingQuote(rules, destination, cartTotal);
  }
}
