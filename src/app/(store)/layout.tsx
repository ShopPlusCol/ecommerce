import { SiteHeader } from "@/components/store/site-header";
import { SiteFooter } from "@/components/store/site-footer";
import { WhatsAppFloatButton } from "@/components/store/whatsapp-float-button";
import { StoreProviders } from "@/components/store/store-providers";
import { ConsentBanner } from "@/components/store/consent-banner";
import { MaintenanceNotice } from "@/components/store/maintenance-notice";
import { promotionsRepository } from "@/lib/container";
import { getBrandSettings } from "@/modules/settings/brand";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  // Reglas de recompensa cargadas en servidor (contrato definitivo) para el
  // cálculo inmediato de la barra de progreso en el cliente.
  const [rewardRules, brand] = await Promise.all([
    promotionsRepository.listActiveRewardRules(),
    getBrandSettings(),
  ]);
  const maintenance = process.env.MAINTENANCE_MODE === "true";

  return (
    <StoreProviders rewardRules={rewardRules}>
      <SiteHeader brand={brand} />
      <main className="flex-1">{maintenance ? <MaintenanceNotice /> : children}</main>
      <SiteFooter brand={brand} />
      <WhatsAppFloatButton brand={brand} />
      <ConsentBanner />
    </StoreProviders>
  );
}
