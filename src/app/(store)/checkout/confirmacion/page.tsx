import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { OrderConfirmationClient } from "@/components/store/checkout/order-confirmation-client";

export const metadata: Metadata = { title: "Confirmación de pedido", robots: { index: false } };

export default function OrderConfirmationPage() {
  return (
    <Section spacing="lg">
      <Container>
        <OrderConfirmationClient />
      </Container>
    </Section>
  );
}
