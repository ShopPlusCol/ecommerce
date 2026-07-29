import type { CatalogRepository } from "@/application/ports/catalog-repository";
import type { PromotionsRepository } from "@/application/ports/promotions-repository";
import type { ShippingRateResolver } from "@/application/ports/shipping-rate-resolver";
import type { PageRepository } from "@/application/ports/page-repository";
import { DrizzleCatalogRepository } from "@/infrastructure/catalog/drizzle-catalog-repository";
import { DrizzlePromotionsRepository } from "@/infrastructure/promotions/drizzle-promotions-repository";
import { DrizzleShippingResolver } from "@/infrastructure/shipping/drizzle-shipping-resolver";
import { DrizzlePageRepository } from "@/infrastructure/pages/drizzle-page-repository";

/**
 * Composition root: instancia los adaptadores concretos y los expone tras sus
 * interfaces. La tienda importa desde aquí, nunca los adaptadores directos.
 * En la Fase 3, cambiar de adaptador demo a Drizzle/D1 es un cambio local a
 * este archivo (sección 28.1).
 */
export const catalogRepository: CatalogRepository = new DrizzleCatalogRepository();
export const promotionsRepository: PromotionsRepository = new DrizzlePromotionsRepository();
export const shippingResolver: ShippingRateResolver = new DrizzleShippingResolver();
export const pageRepository: PageRepository = new DrizzlePageRepository();
