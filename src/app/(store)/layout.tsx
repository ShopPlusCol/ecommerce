import { SiteHeader } from "@/components/store/site-header";
import { SiteFooter } from "@/components/store/site-footer";
import { WhatsAppFloatButton } from "@/components/store/whatsapp-float-button";
import { StoreProviders } from "@/components/store/store-providers";
import { ConsentBanner } from "@/components/store/consent-banner";
import { promotionsRepository } from "@/lib/container";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  // Reglas de recompensa cargadas en servidor (contrato definitivo) para el
  // cálculo inmediato de la barra de progreso en el cliente.
  const rewardRules = await promotionsRepository.listActiveRewardRules();

  return (
    <StoreProviders rewardRules={rewardRules}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsAppFloatButton />
      <ConsentBanner />
    </StoreProviders>
  );
}
