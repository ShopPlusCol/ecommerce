import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PageHeader } from "@/components/store/page-header";
import { ProductCard } from "@/components/store/product-card";
import { ProductPurchasePanel } from "@/components/store/product/product-purchase-panel";
import { ProductStickyBar } from "@/components/store/product/product-sticky-bar";
import { CartUpsells } from "@/components/store/cart/cart-upsells";
import { formatMoney } from "@/domain/value-objects/money";
import { catalogRepository } from "@/lib/container";
import { siteConfig } from "@/lib/site-config";
import { productJsonLd } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await catalogRepository.getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalogRepository.getProductBySlug(slug);
  if (!product) return { title: "Producto" };
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/productos/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.media[0] ? [product.media[0].url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await catalogRepository.getProductBySlug(slug);
  if (!product) notFound();

  const [related, upsells] = await Promise.all([
    catalogRepository.getRelatedProducts(product.id, 4),
    catalogRepository.getUpsellProducts(product.id, 3),
  ]);

  const cover = product.media[0];
  const jsonLd = productJsonLd(product);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader
        title={product.name}
        breadcrumbs={[
          { href: "/catalogo", label: "Catálogo" },
          { href: `/productos/${product.slug}`, label: product.name },
        ]}
      />

      <Section spacing="sm">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-sunken">
              {cover ? (
                <Image src={cover.url} alt={cover.altText} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-4 pb-20 md:pb-0">
            {product.colorFamily ? (
              <span className="text-xs font-medium uppercase tracking-wide text-text-subtle">
                {product.colorFamily.name}
              </span>
            ) : null}

            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold text-text">{formatMoney(product.price)}</span>
              {product.compareAtPrice ? (
                <span className="text-md text-text-subtle line-through">{formatMoney(product.compareAtPrice)}</span>
              ) : null}
            </div>

            <ProductPurchasePanel product={product} />

            <p className="text-text-muted">{product.description}</p>

            <div className="rounded-lg bg-surface-sunken p-4 text-sm text-text-muted">
              <p className="font-medium text-text">Antes de comprar, ten en cuenta:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Lente cosmético sin fórmula ni aumento.</li>
                <li>El tono puede variar según la iluminación, la cámara y el color natural de tu iris.</li>
                <li>Incluye recomendaciones de cuidado e higiene.</li>
              </ul>
            </div>

            <CartUpsells products={upsells} title="Complementa tu compra" />
          </div>
        </Container>
      </Section>

      {related.length > 0 ? (
        <Section spacing="sm" tone="sunken">
          <Container>
            <h2 className="text-xl text-text">También te puede gustar</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <ProductStickyBar product={product} />
      <p className="sr-only">
        ¿Dudas? Escríbenos por WhatsApp al {siteConfig.contact.whatsappNumber}.
      </p>
    </>
  );
}
