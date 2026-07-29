import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { CheckoutClient } from "@/components/store/checkout/checkout-client";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <PageHeader
        title="Finaliza tu compra"
        description="Compra como invitada, sin crear una cuenta. Verás con claridad qué pagas ahora y qué pagas al recibir."
      />
      <Section spacing="sm">
        <Container>
          <CheckoutClient />
        </Container>
      </Section>
    </>
  );
}
