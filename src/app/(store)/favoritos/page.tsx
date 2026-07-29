import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { FavoritesPageClient } from "@/components/store/favorites-page-client";
import { catalogRepository } from "@/lib/container";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritesPage() {
  const { products } = await catalogRepository.listProducts({ pageSize: 200 });

  return (
    <>
      <PageHeader title="Favoritos" description="Guarda los tonos que más te gustan, sin necesidad de crear una cuenta." />
      <Section spacing="sm">
        <Container>
          <FavoritesPageClient products={products} />
        </Container>
      </Section>
    </>
  );
}
