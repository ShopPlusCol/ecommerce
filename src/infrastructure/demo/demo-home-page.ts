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
        eyebrow: "Nueva colección de temporada",
        title: "Cambia tu mirada, sin complicarte.",
        subtitle:
          "Lentes de contacto cosméticos sin fórmula, en tonos que se ven naturales en cualquier color de ojos. Entrega el mismo día en Medellín.",
        ctaLabel: "Ver catálogo",
        ctaHref: "/catalogo",
        secondaryLabel: "Cómo elegir mi tono",
        secondaryHref: "/cuidados",
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
          { title: "Entrega el mismo día", body: "En Medellín y el Área Metropolitana, pidiendo antes de la hora límite." },
          { title: "Pago contra entrega", body: "Paga en efectivo o datáfono cuando recibas tu pedido en Medellín." },
          { title: "Cuidado guiado", body: "Guía de uso e higiene incluida con cada compra." },
        ],
      },
    },
    {
      id: "home-testimonials",
      type: "testimonials",
      ...visible,
      config: {
        title: "Lo que dicen nuestras clientas",
        items: [
          { name: "Valentina R.", city: "Medellín", quote: "Llegó el mismo día y el color se ve precioso." },
          { name: "Camila G.", city: "Envigado", quote: "Primera vez que compro lentes cosméticos y la atención fue clarísima." },
          { name: "Mariana P.", city: "Bello", quote: "El tono Amazon Brown es justo lo que buscaba para mi tono de piel." },
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
          { question: "¿Cómo pago el envío en Medellín?", answer: "En Medellín y el Área Metropolitana puedes pagar contra entrega." },
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
