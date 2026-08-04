import { cache } from "react";
import { money, type Money } from "@/domain/value-objects/money";
import { resolveEffectiveZoneConfig } from "@/domain/services/shipping";
import {
  resolveSameDayPromise,
  sameDayPromiseLabel,
  type SameDayPromise,
  type SameDayZoneConfig,
} from "@/domain/services/store-promise";
import { loadShippingTree } from "@/infrastructure/shipping/zone-tree-repository";
import { catalogRepository } from "@/lib/container";

export type StoreOffer = {
  /** Precio más bajo del catálogo activo, o `null` si no hay productos. */
  fromPrice: Money | null;
  sameDay: SameDayPromise;
  /** Texto ya acotado a las ciudades reales, o `null` si no hay nada que prometer. */
  sameDayLabel: string | null;
  /** Ciudades donde el pago contra entrega está realmente habilitado. */
  cashOnDeliveryCities: string[];
};

/**
 * Datos comerciales que la portada necesita para hablar con precio y
 * condiciones reales en vez de texto fijo: el precio "desde" sale del
 * catálogo y la promesa de entrega sale del árbol de zonas de envío, con la
 * misma herencia que usa el checkout (`resolveEffectiveZoneConfig`), no de
 * una lista de ciudades escrita a mano.
 *
 * `cache` lo deduplica dentro de la misma petición: la portada lo consulta
 * desde el hero y desde la franja de confianza sin repetir las consultas.
 */
export const getStoreOffer = cache(async function getStoreOffer(now = new Date()): Promise<StoreOffer> {
  const [{ zones, rules }, catalog] = await Promise.all([
    loadShippingTree(),
    catalogRepository.listProducts({ pageSize: 200 }),
  ]);

  // Solo lentes, no accesorios: el precio "desde" del hero acompaña a
  // "lentes + estuche", así que tomar el mínimo de todo el catálogo haría
  // que una pinza de $15.000 o un líquido se anunciaran como si fueran el
  // precio de los lentes. Un lente siempre tiene familia de color (es su
  // tono); los accesorios no — ese es el discriminador real de los datos.
  const prices = catalog.products
    .filter((product) => product.status === "active" && product.colorFamily !== null)
    .map((product) => product.price.amount)
    .filter((amount) => amount > 0);
  const fromPrice = prices.length ? money(Math.min(...prices)) : null;

  // Solo ciudades: prometer "mismo día" a nivel departamento o país sería
  // exactamente la promesa global y engañosa que hay que evitar.
  const cityZones = zones.filter((zone) => zone.level === "city");

  const sameDayConfigs: SameDayZoneConfig[] = [];
  const cashOnDeliveryCities: string[] = [];

  for (const zone of cityZones) {
    const config = resolveEffectiveZoneConfig(zones, rules, zone.id);
    // Una zona inactiva (o con un ancestro inactivo) no vende, así que
    // tampoco promete; lo mismo si su cobertura efectiva está retirada.
    if (!config || !config.effectivelyActive) continue;
    if (config.coverage.value === "unavailable") continue;

    if (config.sameDayAvailable.value === true) {
      sameDayConfigs.push({
        cityName: zone.name,
        sameDayAvailable: true,
        cutoffHour: config.sameDayCutoffHour.value,
      });
    }
    if (config.cashOnDeliveryAllowed.value === true) {
      cashOnDeliveryCities.push(zone.name);
    }
  }

  const sameDay = resolveSameDayPromise(sameDayConfigs, now);

  return {
    fromPrice,
    sameDay,
    sameDayLabel: sameDayPromiseLabel(sameDay),
    cashOnDeliveryCities: [...new Set(cashOnDeliveryCities)].sort((a, b) => a.localeCompare(b, "es")),
  };
});
