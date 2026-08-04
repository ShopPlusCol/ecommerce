import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { CheckoutClient } from "@/components/store/checkout/checkout-client";
import { listShippingDepartmentsAction } from "@/app/(store)/shipping-location-actions";
import { getPaymentMethodsCopyAction } from "@/app/(store)/payment-methods-actions";
import { getStoreContentAction, getCheckoutFieldsAction } from "@/app/(store)/site-content-actions";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
// Departamentos, copy de pago, textos y config del formulario son
// editables desde el panel de administración: sin esto, Next.js podría
// prerenderizar esta página en build y congelar esos valores hasta el
// próximo despliegue en vez de reflejar el estado actual de la base.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  // Datos globales (no dependen del carrito ni de la sesión): se resuelven
  // en servidor una sola vez en lugar de que el cliente dispare 4 fetches
  // aparte en el montaje (sección de rendimiento del checkout).
  const [departments, paymentMethodsCopy, { texts }, fieldConfig] = await Promise.all([
    listShippingDepartmentsAction(),
    getPaymentMethodsCopyAction(),
    getStoreContentAction(),
    getCheckoutFieldsAction(),
  ]);

  return (
    <>
      <PageHeader
        title="Finaliza tu compra"
        description="Compra como invitada, sin crear una cuenta. Verás con claridad qué pagas ahora y qué pagas al recibir."
      />
      <Section spacing="sm">
        <Container>
          <CheckoutClient
            initialDepartments={departments}
            initialPaymentMethodsCopy={paymentMethodsCopy}
            initialPaymentDisclaimer={texts.checkoutPaymentDisclaimer}
            initialFieldConfig={fieldConfig}
          />
        </Container>
      </Section>
    </>
  );
}
