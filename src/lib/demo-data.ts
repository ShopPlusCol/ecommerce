import { money } from "@/domain/value-objects/money";
import type { Category, ColorFamily, Product } from "@/domain/entities/catalog";

/**
 * Contenido de ejemplo para navegar la Fase 1. Representa la forma real de
 * los datos (mismo tipo que usará la base de datos), pero vive en código
 * mientras el catálogo se conecta a Drizzle/D1 en la Fase 2 y 3. No es
 * contenido comercial definitivo.
 */

export const demoColorFamilies: ColorFamily[] = [
  { id: "cf-miel", slug: "miel-cafe", name: "Miel / Café", hexSwatch: "#9a6a3a" },
  { id: "cf-gris", slug: "gris", name: "Gris", hexSwatch: "#8b8f94" },
  { id: "cf-verde", slug: "verde", name: "Verde", hexSwatch: "#3f7a5a" },
  { id: "cf-azul", slug: "azul", name: "Azul", hexSwatch: "#3a6d9a" },
  { id: "cf-halloween", slug: "halloween", name: "Halloween", hexSwatch: "#87233d" },
];

export const demoCategories: Category[] = [
  {
    id: "cat-lentes",
    slug: "lentes",
    name: "Lentes de contacto",
    description: "Lentes cosméticos sin fórmula en tonos naturales y de temporada.",
    parentId: null,
    imageUrl: null,
    order: 1,
    visibleInMenu: true,
    visibleInFilters: true,
    archivedAt: null,
  },
  {
    id: "cat-accesorios",
    slug: "accesorios",
    name: "Accesorios",
    description: "Todo para el cuidado diario de tus lentes.",
    parentId: null,
    imageUrl: null,
    order: 2,
    visibleInMenu: true,
    visibleInFilters: true,
    archivedAt: null,
  },
  {
    id: "cat-halloween",
    slug: "halloween",
    name: "Halloween",
    description: "Tonos dramáticos de edición limitada.",
    parentId: "cat-lentes",
    imageUrl: null,
    order: 3,
    visibleInMenu: true,
    visibleInFilters: true,
    archivedAt: null,
  },
];

const basePrice = money(49_000);

export const demoProducts: Product[] = [
  {
    id: "prod-amazon-brown",
    slug: "amazon-brown",
    sku: "SPC-LEN-001",
    status: "active",
    name: "Amazon Brown",
    shortDescription: "Un café miel luminoso, perfecto para ojos claros y oscuros.",
    description:
      "Lente cosmético sin fórmula ni aumento. Efecto natural con difuminado suave en los bordes.",
    price: basePrice,
    compareAtPrice: null,
    colorFamily: demoColorFamilies[0],
    categoryIds: ["cat-lentes"],
    media: [{ id: "m1", url: "/demo/lentes-placeholder.svg", altText: "Lente Amazon Brown", order: 0, isVideoPoster: false }],
    badges: ["mas-vendido"],
    stock: 24,
    allowBackorder: false,
    featured: true,
    publishedAt: "2026-01-10T00:00:00.000Z",
    purchaseLimit: null,
  },
  {
    id: "prod-oslo",
    slug: "oslo",
    sku: "SPC-LEN-002",
    status: "active",
    name: "Oslo",
    shortDescription: "Gris ceniza con un anillo definido, ideal para looks editoriales.",
    description:
      "Lente cosmético sin fórmula ni aumento. Tono gris frío con textura realista de iris.",
    price: basePrice,
    compareAtPrice: money(59_000),
    colorFamily: demoColorFamilies[1],
    categoryIds: ["cat-lentes"],
    media: [{ id: "m2", url: "/demo/lentes-placeholder.svg", altText: "Lente Oslo", order: 0, isVideoPoster: false }],
    badges: ["promocion"],
    stock: 12,
    allowBackorder: false,
    featured: true,
    publishedAt: "2026-02-01T00:00:00.000Z",
    purchaseLimit: null,
  },
  {
    id: "prod-boreal",
    slug: "boreal",
    sku: "SPC-LEN-003",
    status: "active",
    name: "Boreal",
    shortDescription: "Verde bosque profundo con reflejos dorados.",
    description: "Lente cosmético sin fórmula ni aumento. Ideal para pieles cálidas.",
    price: basePrice,
    compareAtPrice: null,
    colorFamily: demoColorFamilies[2],
    categoryIds: ["cat-lentes"],
    media: [{ id: "m3", url: "/demo/lentes-placeholder.svg", altText: "Lente Boreal", order: 0, isVideoPoster: false }],
    badges: ["nuevo"],
    stock: 18,
    allowBackorder: false,
    featured: true,
    publishedAt: "2026-04-01T00:00:00.000Z",
    purchaseLimit: null,
  },
  {
    id: "prod-santorini",
    slug: "santorini",
    sku: "SPC-LEN-004",
    status: "active",
    name: "Santorini",
    shortDescription: "Azul aguamarina con acabado cristalino.",
    description: "Lente cosmético sin fórmula ni aumento. Efecto luminoso muy natural.",
    price: basePrice,
    compareAtPrice: null,
    colorFamily: demoColorFamilies[3],
    categoryIds: ["cat-lentes"],
    media: [{ id: "m4", url: "/demo/lentes-placeholder.svg", altText: "Lente Santorini", order: 0, isVideoPoster: false }],
    badges: [],
    stock: 0,
    allowBackorder: false,
    featured: false,
    publishedAt: "2026-03-01T00:00:00.000Z",
    purchaseLimit: null,
  },
  {
    id: "prod-crimson-eclipse",
    slug: "crimson-eclipse",
    sku: "SPC-LEN-H01",
    status: "active",
    name: "Crimson Eclipse",
    shortDescription: "Rojo intenso de edición Halloween.",
    description: "Lente cosmético de temporada sin fórmula ni aumento. Uso ocasional recomendado.",
    price: money(55_000),
    compareAtPrice: null,
    colorFamily: demoColorFamilies[4],
    categoryIds: ["cat-lentes", "cat-halloween"],
    media: [{ id: "m5", url: "/demo/lentes-placeholder.svg", altText: "Lente Crimson Eclipse", order: 0, isVideoPoster: false }],
    badges: ["halloween"],
    stock: 30,
    allowBackorder: false,
    featured: false,
    publishedAt: "2026-09-01T00:00:00.000Z",
    purchaseLimit: null,
  },
  {
    id: "prod-liquido",
    slug: "liquido-multipropósito-120ml",
    sku: "SPC-ACC-001",
    status: "active",
    name: "Solución multipropósito 120ml",
    shortDescription: "Limpieza, enjuague y almacenamiento diario.",
    description: "Solución salina para el cuidado diario de lentes de contacto cosméticos.",
    price: money(28_000),
    compareAtPrice: null,
    colorFamily: null,
    categoryIds: ["cat-accesorios"],
    media: [{ id: "m6", url: "/demo/accesorio-placeholder.svg", altText: "Solución multipropósito", order: 0, isVideoPoster: false }],
    badges: [],
    stock: 40,
    allowBackorder: false,
    featured: false,
    publishedAt: "2026-01-10T00:00:00.000Z",
    purchaseLimit: null,
  },
];

export const demoFaqs: Array<{ question: string; answer: string }> = [
  {
    question: "¿Necesito fórmula médica para comprar?",
    answer:
      "No. Todos nuestros lentes son cosméticos, sin fórmula y sin aumento, pensados para cambiar el color de tus ojos.",
  },
  {
    question: "¿El tono se verá igual que en la foto?",
    answer:
      "El resultado varía según la iluminación, la cámara y el color natural de tu iris. Las fotos son orientativas.",
  },
  {
    question: "¿Cómo pago el envío en Medellín?",
    answer:
      "En Medellín y el Área Metropolitana puedes pagar contraentrega. En el resto de Colombia, el envío se paga por anticipado.",
  },
  {
    question: "¿Puedo cambiar de tono si no me gusta?",
    answer: "Sí, revisa nuestra política de cambios y devoluciones para conocer los plazos y condiciones.",
  },
];

export const demoTestimonials: Array<{ name: string; city: string; quote: string }> = [
  { name: "Valentina R.", city: "Medellín", quote: "Llegó el mismo día y el color se ve precioso." },
  { name: "Camila G.", city: "Envigado", quote: "Primera vez que compro lentes cosméticos y la atención fue clarísima." },
  { name: "Mariana P.", city: "Bello", quote: "El tono Amazon Brown es justo lo que buscaba para mi tono de piel." },
];
