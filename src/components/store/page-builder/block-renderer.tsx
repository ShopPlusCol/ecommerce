import type { Block } from "@/modules/page-builder/blocks";
import { cn } from "@/lib/utils";
import { HeroBlock } from "@/components/store/page-builder/blocks/hero-block";
import { ColorFamiliesBlock } from "@/components/store/page-builder/blocks/color-families-block";
import { ProductCollectionBlock } from "@/components/store/page-builder/blocks/product-collection-block";
import { BenefitsBlock } from "@/components/store/page-builder/blocks/benefits-block";
import { ImageTextBlock } from "@/components/store/page-builder/blocks/image-text-block";
import { TestimonialsBlock } from "@/components/store/page-builder/blocks/testimonials-block";
import { FaqBlock } from "@/components/store/page-builder/blocks/faq-block";
import { CtaBlock } from "@/components/store/page-builder/blocks/cta-block";

function renderBlock(block: Block) {
  switch (block.type) {
    case "hero":
      return <HeroBlock config={block.config} />;
    case "color_families":
      return <ColorFamiliesBlock config={block.config} />;
    case "product_collection":
      return <ProductCollectionBlock config={block.config} />;
    case "benefits":
      return <BenefitsBlock config={block.config} />;
    case "image_text":
      return <ImageTextBlock config={block.config} />;
    case "testimonials":
      return <TestimonialsBlock config={block.config} />;
    case "faq":
      return <FaqBlock config={block.config} />;
    case "cta":
      return <CtaBlock config={block.config} />;
    default:
      return null;
  }
}

/** Clase de visibilidad por dispositivo (sección 15.3). */
function visibilityClass(block: Block): string | undefined {
  if (block.visibleOnMobile && block.visibleOnDesktop) return undefined;
  if (block.visibleOnDesktop) return "hidden md:block";
  if (block.visibleOnMobile) return "md:hidden";
  return "hidden";
}

/**
 * Renderiza una página compuesta por bloques (sección 15). Product blocks son
 * componentes async que resuelven sus datos desde el catálogo. Un bloque
 * desconocido se omite en lugar de romper la página.
 */
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block) => {
        const cls = visibilityClass(block);
        const content = renderBlock(block);
        if (!content) return null;
        return cls ? (
          <div key={block.id} className={cn(cls)}>
            {content}
          </div>
        ) : (
          <div key={block.id}>{content}</div>
        );
      })}
    </>
  );
}
