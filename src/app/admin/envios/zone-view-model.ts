import { resolveEffectiveZoneConfig, type ShippingRuleConfig, type ShippingZoneNode } from "@/domain/services/shipping";
import type { ZoneConfigFormProps } from "./zone-config-form";

export function formatCOP(amount: number) {
  return amount.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export function countDescendants(zoneId: string, zones: ShippingZoneNode[]): number {
  const children = zones.filter((z) => z.parentZoneId === zoneId);
  return children.length + children.reduce((sum, child) => sum + countDescendants(child.id, zones), 0);
}

export function deleteWarningFor(zone: ShippingZoneNode, zones: ShippingZoneNode[]): string {
  const count = countDescendants(zone.id, zones);
  if (count === 0) return "";
  return ` Esto también eliminará ${count} zona(s) hija(s) y su configuración.`;
}

export type ZoneCardSummaryData = {
  status: "active" | "inactive";
  effectivelyActive: boolean;
  feeLabel: string;
  feeOwn: boolean;
  coverageBlocked: boolean;
  coverageOwn: boolean;
  cashOnDeliveryAllowed: boolean;
  cashOwn: boolean;
  sameDayAvailable: boolean;
  sameDayOwn: boolean;
};

export function summarizeZone(zoneId: string, zones: ShippingZoneNode[], rules: ShippingRuleConfig[]): ZoneCardSummaryData {
  const zone = zones.find((z) => z.id === zoneId)!;
  const eff = resolveEffectiveZoneConfig(zones, rules, zoneId)!;
  return {
    status: zone.status,
    effectivelyActive: eff.effectivelyActive,
    feeLabel: eff.fee.value ? formatCOP(eff.fee.value.amount) : "Sin tarifa configurada",
    feeOwn: eff.fee.inheritedFrom === null,
    coverageBlocked: eff.coverage.value === "unavailable",
    coverageOwn: eff.coverage.inheritedFrom === null,
    cashOnDeliveryAllowed: eff.cashOnDeliveryAllowed.value ?? false,
    cashOwn: eff.cashOnDeliveryAllowed.inheritedFrom === null,
    sameDayAvailable: eff.sameDayAvailable.value ?? false,
    sameDayOwn: eff.sameDayAvailable.inheritedFrom === null,
  };
}

export function buildZoneConfigFormProps(zoneId: string, zones: ShippingZoneNode[], rules: ShippingRuleConfig[]): ZoneConfigFormProps {
  const zone = zones.find((z) => z.id === zoneId)!;
  const own = rules.find((r) => r.zoneId === zoneId) ?? null;
  const eff = resolveEffectiveZoneConfig(zones, rules, zoneId)!;
  const ancestorsActive = eff.chain.slice(1).every((z) => z.status === "active");

  return {
    zoneId,
    name: zone.name,
    status: zone.status,
    ancestorsActive,
    fee: { own: own?.fee?.amount ?? null, effective: eff.fee.value?.amount ?? null, inheritedFromName: eff.fee.inheritedFrom?.name ?? null },
    freeShippingThreshold: {
      own: own?.freeShippingThreshold?.amount ?? null,
      effective: eff.freeShippingThreshold.value?.amount ?? null,
      inheritedFromName: eff.freeShippingThreshold.inheritedFrom?.name ?? null,
    },
    coverage: { own: own?.coverage ?? null, effective: eff.coverage.value, inheritedFromName: eff.coverage.inheritedFrom?.name ?? null },
    cashOnDeliveryAllowed: { own: own?.cashOnDeliveryAllowed ?? null, effective: eff.cashOnDeliveryAllowed.value, inheritedFromName: eff.cashOnDeliveryAllowed.inheritedFrom?.name ?? null },
    requiresAdvancePayment: { own: own?.requiresAdvancePayment ?? null, effective: eff.requiresAdvancePayment.value, inheritedFromName: eff.requiresAdvancePayment.inheritedFrom?.name ?? null },
    advancePercentage: { own: own?.advancePercentage ?? null, effective: eff.advancePercentage.value, inheritedFromName: eff.advancePercentage.inheritedFrom?.name ?? null },
    sameDayAvailable: { own: own?.sameDayAvailable ?? null, effective: eff.sameDayAvailable.value, inheritedFromName: eff.sameDayAvailable.inheritedFrom?.name ?? null },
    sameDayCutoffHour: { own: own?.sameDayCutoffHour ?? null, effective: eff.sameDayCutoffHour.value, inheritedFromName: eff.sameDayCutoffHour.inheritedFrom?.name ?? null },
    estimatedBusinessDaysMin: { own: own?.estimatedBusinessDaysMin ?? null, effective: eff.estimatedBusinessDaysMin.value, inheritedFromName: eff.estimatedBusinessDaysMin.inheritedFrom?.name ?? null },
    estimatedBusinessDaysMax: { own: own?.estimatedBusinessDaysMax ?? null, effective: eff.estimatedBusinessDaysMax.value, inheritedFromName: eff.estimatedBusinessDaysMax.inheritedFrom?.name ?? null },
    allowedPaymentMethods: { own: own?.allowedPaymentMethods ?? null, effective: eff.allowedPaymentMethods.value, inheritedFromName: eff.allowedPaymentMethods.inheritedFrom?.name ?? null },
    customerMessage: { own: own?.customerMessage ?? null, effective: eff.customerMessage.value, inheritedFromName: eff.customerMessage.inheritedFrom?.name ?? null },
  };
}
