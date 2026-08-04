"use client";

import type { RewardRule } from "@/domain/entities/promotions";
import { CartProvider } from "@/modules/cart/cart-context";
import { FavoritesProvider } from "@/modules/favorites/favorites-context";
import { AnalyticsProvider } from "@/modules/analytics/analytics-context";
import { CartDrawer } from "@/components/store/cart/cart-drawer";
import { MetaPixel } from "@/components/store/meta-pixel";
import { PageViewTracker } from "@/components/store/page-view-tracker";
import { UtmAttribution } from "@/components/store/utm-attribution";
import { WebVitalsReporter } from "@/components/store/web-vitals-reporter";

/**
 * Raíz de proveedores de la tienda pública. Recibe las reglas de recompensa
 * cargadas en servidor (contrato definitivo) para que el cálculo del carrito
 * y la barra de progreso sean inmediatos en el cliente.
 */
export function StoreProviders({
  rewardRules,
  metaPixelId,
  children,
}: {
  rewardRules: RewardRule[];
  /** ID de píxel de Meta, o `null` si la integración está desactivada o sin credenciales. */
  metaPixelId?: string | null;
  children: React.ReactNode;
}) {
  return (
    <AnalyticsProvider>
      <FavoritesProvider>
        <CartProvider rewardRules={rewardRules}>
          {children}
          <CartDrawer />
          {/* MetaPixel va ANTES de PageViewTracker a propósito: los efectos
              de hermanos corren en orden de montaje, y el tracker necesita
              que `window.fbq` ya exista para que la primera vista llegue
              también al píxel y no solo a la Conversions API.
              El componente no carga nada sin consentimiento de marketing. */}
          {metaPixelId ? <MetaPixel pixelId={metaPixelId} /> : null}
          <PageViewTracker />
          <UtmAttribution />
          <WebVitalsReporter />
        </CartProvider>
      </FavoritesProvider>
    </AnalyticsProvider>
  );
}
