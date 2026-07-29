/**
 * Modelo de bloques del editor visual (sección 15). Cada bloque tiene un tipo,
 * un identificador estable, banderas de visibilidad y una configuración
 * tipada. Coincide con la tabla `page_sections` (config JSON validada); en la
 * Fase 3 el editor administrativo produce exactamente esta estructura y la
 * tienda la renderiza sin cambios.
 */
export type BlockBase = {
  id: string;
  visibleOnMobile: boolean;
  visibleOnDesktop: boolean;
};

export type HeroBlock = BlockBase & {
  type: "hero";
  config: {
    eyebrow?: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    secondaryLabel?: string;
    secondaryHref?: string;
  };
};

export type ColorFamiliesBlock = BlockBase & {
  type: "color_families";
  config: { title: string };
};

export type ProductCollectionBlock = BlockBase & {
  type: "product_collection";
  config: {
    title: string;
    source: { collectionSlug: string } | { filter: "featured" | "promotion" | "newest" | "best_selling" };
    limit: number;
    viewAllHref?: string;
    tone?: "default" | "sunken";
  };
};

export type BenefitsBlock = BlockBase & {
  type: "benefits";
  config: { items: Array<{ title: string; body: string }> };
};

export type ImageTextBlock = BlockBase & {
  type: "image_text";
  config: {
    title: string;
    body: string;
    imageUrl: string | null;
    ctaLabel?: string;
    ctaHref?: string;
    reverse?: boolean;
  };
};

export type TestimonialsBlock = BlockBase & {
  type: "testimonials";
  config: { title: string; items: Array<{ name: string; city: string; quote: string }> };
};

export type FaqBlock = BlockBase & {
  type: "faq";
  config: { title: string; items: Array<{ question: string; answer: string }>; viewAllHref?: string };
};

export type CtaBlock = BlockBase & {
  type: "cta";
  config: { title: string; ctaLabel: string; ctaHref: string };
};

export type Block =
  | HeroBlock
  | ColorFamiliesBlock
  | ProductCollectionBlock
  | BenefitsBlock
  | ImageTextBlock
  | TestimonialsBlock
  | FaqBlock
  | CtaBlock;

export type PageDefinition = {
  slug: string;
  title: string;
  blocks: Block[];
};
