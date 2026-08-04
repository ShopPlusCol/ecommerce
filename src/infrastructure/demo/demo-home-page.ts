import type { PageDefinition } from "@/modules/page-builder/blocks";

const visible = { visibleOnMobile: true, visibleOnDesktop: true };

/**
 * Definición de la página de inicio como conjunto de bloques (Fase 2). En la
 * Fase 3 esta estructura vive en la base de datos y se edita desde el panel;
 * la tienda ya la renderiza con el mismo motor de bloques.
 */
export const demoHomePage: PageDefinition = {
  slug: "inicio",
  title: "Inicio",
  blocks: [
    {
      id: "home-hero",
      type: "hero",
      ...visible,
      config: {
        eyebrow: "Lentes cosméticos sin fórmula",
        title: "Transforma tu mirada con el tono perfecto",
        // `{precio}` lo reemplaza el hero con el precio real más bajo del
        // catálogo: el primer pantallazo no puede quedar desactualizado.
        offerLabel: "Lentes + estuche desde {precio}",
        includesNote: "par de lentes + estuche sencillo",
        excludesNote: "líquido ni domicilio",
        // La promesa de entrega ya no se escribe aquí: la calcula el hero
        // contra las zonas de envío reales y la hora límite configurada.
        subtitle:
          "Explora tonos cafés, grises, verdes y azules con fotografías reales. Lentes cosméticos sin fórmula ni aumento.",
        ctaLabel: "Ver todos los tonos",
        ctaHref: "/catalogo",
        secondaryLabel: "Cómo elegir mi tono",
        secondaryHref: "/cuidados",
        imageUrl: null,
        imageAlt: "",
      },
    },
    { id: "home-colors", type: "color_families", ...visible, config: { title: "Elige por tono" } },
    {
      id: "home-bestsellers",
      type: "product_collection",
      ...visible,
      config: {
        title: "Más vendidos",
        source: { collectionSlug: "mas-vendidos" },
        limit: 4,
        viewAllHref: "/coleccion/mas-vendidos",
        tone: "sunken",
      },
    },
    {
      id: "home-howto",
      type: "image_text",
      ...visible,
      config: {
        title: "Cómo elegir tu tono ideal",
        body: "Los tonos claros iluminan la mirada y se notan más en ojos oscuros; los tonos como el gris y el azul dan un efecto editorial. Recuerda que el resultado depende de tu iris, la luz y la cámara.",
        imageUrl: "/demo/lentes-placeholder.svg",
        ctaLabel: "Ver guía de cuidados",
        ctaHref: "/cuidados",
      },
    },
    {
      id: "home-new",
      type: "product_collection",
      ...visible,
      config: { title: "Novedades", source: { filter: "newest" }, limit: 4, viewAllHref: "/catalogo?order=newest" },
    },
    {
      id: "home-benefits",
      type: "benefits",
      ...visible,
      config: {
        items: [
          { title: "Entrega rápida en zonas habilitadas", body: "El mismo día donde la zona lo permita, pidiendo antes de la hora límite. Confírmalo en el checkout con tu dirección." },
          { title: "Pago contra entrega", body: "Disponible en las zonas habilitadas: pagas cuando recibes el pedido." },
          { title: "Lentes + estuche", body: "Cada compra incluye el par de lentes y su estuche. El líquido y el domicilio se cobran aparte." },
        ],
      },
    },
    {
      id: "home-testimonials",
      type: "testimonials",
      ...visible,
      config: {
        title: "Lo que dicen nuestras clientas",
        // Contenido de ejemplo, no testimonios reales: `verified: false` hace
        // que la sección completa no se publique en producción hasta que se
        // reemplacen por testimonios reales con autorización.
        items: [
          { name: "Valentina R.", city: "Medellín", quote: "Llegó el mismo día y el color se ve precioso.", verified: false },
          { name: "Camila G.", city: "Envigado", quote: "Primera vez que compro lentes cosméticos y la atención fue clarísima.", verified: false },
          { name: "Mariana P.", city: "Bello", quote: "El tono Amazon Brown es justo lo que buscaba para mi tono de piel.", verified: false },
        ],
      },
    },
    {
      id: "home-faq",
      type: "faq",
      ...visible,
      config: {
        title: "Preguntas frecuentes",
        viewAllHref: "/preguntas-frecuentes",
        items: [
          { question: "¿Necesito fórmula médica para comprar?", answer: "No. Todos nuestros lentes son cosméticos, sin fórmula y sin aumento." },
          { question: "¿El tono se verá igual que en la foto?", answer: "El resultado varía según la iluminación, la cámara y el color natural de tu iris." },
          { question: "¿Qué incluye la compra?", answer: "El par de lentes y su estuche sencillo. El líquido y el domicilio no están incluidos y se cobran aparte." },
          { question: "¿Cómo pago el domicilio?", answer: "Los métodos disponibles dependen de tu zona. Al escribir tu dirección en el checkout verás cuánto pagas ahora y cuánto al recibir." },
        ],
      },
    },
    {
      id: "home-cta",
      type: "cta",
      ...visible,
      config: { title: "¿Lista para encontrar tu tono?", ctaLabel: "Explorar catálogo", ctaHref: "/catalogo" },
    },
  ],
};
