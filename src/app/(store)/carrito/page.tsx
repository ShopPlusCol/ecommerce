import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { CartPageClient } from "@/components/store/cart/cart-page-client";
import { catalogRepository } from "@/lib/container";

export const metadata: Metadata = { title: "Tu carrito" };

export default async function CartPage() {
  const accessoriesResult = await catalogRepository.listProducts({
    filters: { categorySlug: "accesorios" },
    pageSize: 4,
  });
  const accessories = accessoriesResult.products;

  return (
    <>
      <PageHeader title="Tu carrito" />
      <Section spacing="sm">
        <Container>
          <CartPageClient accessories={accessories} />
        </Container>
      </Section>
    </>
  );
}
