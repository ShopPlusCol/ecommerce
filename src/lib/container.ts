import type { CatalogRepository } from "@/application/ports/catalog-repository";
import type { PromotionsRepository } from "@/application/ports/promotions-repository";
import type { ShippingRateResolver } from "@/application/ports/shipping-rate-resolver";
import type { PageRepository } from "@/application/ports/page-repository";
import { DemoCatalogRepository } from "@/infrastructure/catalog/demo-catalog-repository";
import { DemoPromotionsRepository } from "@/infrastructure/promotions/demo-promotions-repository";
import { DemoShippingResolver } from "@/infrastructure/shipping/demo-shipping-resolver";
import { DemoPageRepository } from "@/infrastructure/pages/demo-page-repository";

/**
 * Composition root: instancia los adaptadores concretos y los expone tras sus
 * interfaces. La tienda importa desde aquí, nunca los adaptadores directos.
 * En la Fase 3, cambiar de adaptador demo a Drizzle/D1 es un cambio local a
 * este archivo (sección 28.1).
 */
export const catalogRepository: CatalogRepository = new DemoCatalogRepository();
export const promotionsRepository: PromotionsRepository = new DemoPromotionsRepository();
export const shippingResolver: ShippingRateResolver = new DemoShippingResolver();
export const pageRepository: PageRepository = new DemoPageRepository();
