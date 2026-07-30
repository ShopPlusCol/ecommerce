import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ShieldCheck, Truck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { PageHeader } from "@/components/store/page-header";
import { ProductCard } from "@/components/store/product-card";
import { ProductPurchasePanel } from "@/components/store/product/product-purchase-panel";
import { ProductStickyBar } from "@/components/store/product/product-sticky-bar";
import { CartUpsells } from "@/components/store/cart/cart-upsells";
import { TryOnLauncher } from "@/components/store/try-on/try-on-launcher";
import { formatMoney } from "@/domain/value-objects/money";
import { catalogRepository, tryOnRepository } from "@/lib/container";
import { siteConfig } from "@/lib/site-config";
import { productJsonLd } from "@/lib/seo";
import { isVideoUrl } from "@/lib/media-type";

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
  const tryOnProducts = [product, ...related].filter((item) => item.sku.startsWith("SPC-LEN"));
  const tryOnTextures = await tryOnRepository.listApprovedByProductIds(tryOnProducts.map((item) => item.id));

  const cover = product.media[0];
  const jsonLd = productJsonLd(product);
  const discount =
    product.compareAtPrice && product.compareAtPrice.amount > product.price.amount
      ? Math.round(((product.compareAtPrice.amount - product.price.amount) / product.compareAtPrice.amount) * 100)
      : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader
        breadcrumbs={[
          { href: "/catalogo", label: "Catálogo" },
          { href: `/productos/${product.slug}`, label: product.name },
        ]}
      />

      <Section spacing="sm">
        <Container className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative aspect-square overflow-hidden rounded-[24px] bg-surface-sunken shadow-sm">
              {cover && isVideoUrl(cover.url) ? (
                <video src={cover.url} controls muted loop playsInline className="h-full w-full object-cover" aria-label={cover.altText} />
              ) : cover ? (
                <Image src={cover.url} alt={cover.altText} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              ) : null}
              {discount ? (
                <span className="absolute left-4 top-4 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-brand-contrast shadow-brand">
                  −{discount}%
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-5 pb-24 md:pb-0">
            {product.colorFamily ? (
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-text-subtle">
                {product.colorFamily.name}
              </span>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <h1 className="font-display text-2xl font-semibold text-text">{product.name}</h1>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-display text-xl font-semibold text-text">{formatMoney(product.price)}</span>
                {product.compareAtPrice ? (
                  <>
                    <span className="text-sm text-text-subtle line-through">{formatMoney(product.compareAtPrice)}</span>
                    {discount ? <span className="text-sm font-medium text-brand">Ahorras {discount}%</span> : null}
                  </>
                ) : null}
              </div>
            </div>

            <ProductPurchasePanel product={product} />

            {product.sku.startsWith("SPC-LEN") ? (
              <TryOnLauncher products={tryOnProducts} textures={tryOnTextures} />
            ) : null}

            {/* Envío y pagos, fácil de comprender (sección 9) */}
            <div className="grid gap-3 rounded-xl border border-border p-4 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <p className="font-medium text-text">Envío el mismo día en Medellín</p>
                  <p className="text-text-muted">A otras ciudades pagas el envío por anticipado.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <p className="font-medium text-text">Paga contra entrega</p>
                  <p className="text-text-muted">En Medellín y Área Metropolitana, en efectivo o datáfono.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <h2 className="font-display text-md font-semibold text-text">Descripción</h2>
              <p className="mt-2 text-text-muted">{product.description}</p>
            </div>

            <div className="rounded-xl bg-surface-sunken p-4 text-sm text-text-muted">
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
            <h2 className="text-2xl text-text">También te puede gustar</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
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
