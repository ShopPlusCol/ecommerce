import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/store/page-builder/block-renderer";
import { pageRepository } from "@/lib/container";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Lentes de contacto cosméticos sin fórmula",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const page = await pageRepository.getHomePage();
  if (!page) notFound();

  const jsonLd = [organizationJsonLd(), websiteJsonLd()];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlockRenderer blocks={page.blocks} />
    </>
  );
}
