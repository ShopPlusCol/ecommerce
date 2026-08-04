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
    /**
     * Campos comerciales del primer pantallazo. Todos opcionales: un hero
     * guardado antes de existir estos campos sigue renderizando igual.
     *
     * `offerLabel` acepta el marcador `{precio}`, que se reemplaza por el
     * precio real más bajo del catálogo — así el precio del hero no queda
     * escrito a mano y no puede quedar desincronizado del catálogo.
     */
    offerLabel?: string;
    /** Qué incluye la compra base (p. ej. "par de lentes + estuche"). */
    includesNote?: string;
    /** Qué no incluye (p. ej. "líquido y domicilio aparte"). */
    excludesNote?: string;
    /** Fotografía real de campaña; sin ella se mantiene el marcador visual. */
    imageUrl?: string | null;
    imageAlt?: string;
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

/**
 * Un testimonio solo se publica si alguien lo marcó como verificado
 * (`verified: true`), es decir: es de una clienta real y hay autorización
 * para mostrar su nombre. Los testimonios sin verificar son contenido de
 * ejemplo y nunca salen a producción — ver `TestimonialsBlock`.
 */
export type Testimonial = {
  name: string;
  city: string;
  quote: string;
  verified?: boolean;
  /** Producto o tono al que se refiere, si se conoce. */
  product?: string;
  /** Fecha del testimonio en ISO (YYYY-MM-DD), para poder ordenarlos. */
  date?: string;
};

export type TestimonialsBlock = BlockBase & {
  type: "testimonials";
  config: { title: string; items: Testimonial[] };
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
