import type { ShippingDestination, ShippingRateResolver } from "@/application/ports/shipping-rate-resolver";
import type { Money } from "@/domain/value-objects/money";
import { resolveShippingQuote } from "@/domain/services/shipping";
import { loadShippingTree } from "@/infrastructure/shipping/zone-tree-repository";

export class DrizzleShippingResolver implements ShippingRateResolver {
  async resolve(destination: ShippingDestination, cartTotal: Money) {
    const { zones, rules } = await loadShippingTree();
    return resolveShippingQuote(zones, rules, destination, cartTotal);
  }
}
