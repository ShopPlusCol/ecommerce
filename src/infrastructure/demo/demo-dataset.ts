import { money } from "@/domain/value-objects/money";
import type { Category, ColorFamily, Product, ProductBadge } from "@/domain/entities/catalog";
import type { Coupon, RewardRule } from "@/domain/entities/promotions";
import type { Collection } from "@/application/ports/catalog-repository";

/**
 * Conjunto de datos de desarrollo controlados (Fase 2). Tiene la misma forma
 * que las entidades del dominio y las tablas de la base de datos, de modo que
 * el adaptador Drizzle de la Fase 3 pueda reemplazarlo sin tocar la tienda.
 * No es contenido comercial definitivo.
 */

export const colorFamilies: ColorFamily[] = [
  { id: "cf-miel", slug: "miel-cafe", name: "Miel / Café", hexSwatch: "#9a6a3a" },
  { id: "cf-gris", slug: "gris", name: "Gris", hexSwatch: "#8b8f94" },
  { id: "cf-verde", slug: "verde", name: "Verde", hexSwatch: "#3f7a5a" },
  { id: "cf-azul", slug: "azul", name: "Azul", hexSwatch: "#3a6d9a" },
  { id: "cf-halloween", slug: "halloween", name: "Halloween", hexSwatch: "#87233d" },
];

export const categories: Category[] = [
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

const LENS_IMG = "/demo/lentes-placeholder.svg";
const ACC_IMG = "/demo/accesorio-placeholder.svg";

type LensSpec = {
  slug: string;
  name: string;
  family: string;
  price?: number;
  compareAt?: number;
  badges?: ProductBadge[];
  stock?: number;
  featured?: boolean;
  halloween?: boolean;
  short: string;
  publishedDaysAgo: number;
};

const LENS_SPECS: LensSpec[] = [
  { slug: "amazon-brown", name: "Amazon Brown", family: "cf-miel", badges: ["mas-vendido"], featured: true, short: "Un café miel luminoso, natural en ojos claros y oscuros.", publishedDaysAgo: 200 },
  { slug: "brown-hazel", name: "Brown Hazel", family: "cf-miel", short: "Avellana cálido con destellos dorados.", publishedDaysAgo: 180 },
  { slug: "toffee", name: "Toffee", family: "cf-miel", compareAt: 59_000, badges: ["promocion"], short: "Caramelo intenso para un look envolvente.", publishedDaysAgo: 90 },
  { slug: "honey-glow", name: "Honey Glow", family: "cf-miel", featured: true, short: "Miel claro con anillo suave.", publishedDaysAgo: 60 },
  { slug: "oslo", name: "Oslo", family: "cf-gris", compareAt: 59_000, badges: ["promocion"], featured: true, short: "Gris ceniza con anillo definido, ideal para editoriales.", publishedDaysAgo: 150 },
  { slug: "silver-fog", name: "Silver Fog", family: "cf-gris", short: "Gris plata frío y luminoso.", publishedDaysAgo: 120 },
  { slug: "storm", name: "Storm", family: "cf-gris", stock: 3, short: "Gris tormenta con profundidad natural.", publishedDaysAgo: 45 },
  { slug: "boreal", name: "Boreal", family: "cf-verde", badges: ["nuevo"], featured: true, short: "Verde bosque profundo con reflejos dorados.", publishedDaysAgo: 20 },
  { slug: "jade", name: "Jade", family: "cf-verde", short: "Verde jade claro y fresco.", publishedDaysAgo: 100 },
  { slug: "olive", name: "Olive", family: "cf-verde", compareAt: 55_000, badges: ["promocion"], short: "Verde oliva terroso y sofisticado.", publishedDaysAgo: 75 },
  { slug: "santorini", name: "Santorini", family: "cf-azul", stock: 0, short: "Azul aguamarina con acabado cristalino.", publishedDaysAgo: 130 },
  { slug: "denim", name: "Denim", family: "cf-azul", badges: ["nuevo"], short: "Azul índigo suave, muy usable de día.", publishedDaysAgo: 15 },
  { slug: "ocean", name: "Ocean", family: "cf-azul", featured: true, short: "Azul océano con degradado natural.", publishedDaysAgo: 85 },
  { slug: "sky", name: "Sky", family: "cf-azul", short: "Azul cielo claro y luminoso.", publishedDaysAgo: 65 },
  { slug: "crimson-eclipse", name: "Crimson Eclipse", family: "cf-halloween", price: 55_000, badges: ["halloween"], halloween: true, short: "Rojo intenso de edición Halloween.", publishedDaysAgo: 40 },
  { slug: "white-out", name: "White Out", family: "cf-halloween", price: 55_000, badges: ["halloween"], halloween: true, short: "Blanco total para caracterización.", publishedDaysAgo: 40 },
  { slug: "cat-eye", name: "Cat Eye", family: "cf-halloween", price: 55_000, badges: ["halloween"], halloween: true, stock: 4, short: "Pupila felina amarilla.", publishedDaysAgo: 38 },
  { slug: "blackout", name: "Blackout", family: "cf-halloween", price: 55_000, badges: ["halloween"], halloween: true, short: "Negro absoluto de gran cobertura.", publishedDaysAgo: 38 },
];

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function buildLens(spec: LensSpec): Product {
  const family = colorFamilies.find((c) => c.id === spec.family) ?? null;
  const stock = spec.stock ?? 24;
  const badges = [...(spec.badges ?? [])];
  return {
    id: `prod-${spec.slug}`,
    slug: spec.slug,
    sku: `SPC-LEN-${spec.slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)}`,
    status: "active",
    name: spec.name,
    shortDescription: spec.short,
    description: `${spec.name} es un lente cosmético sin fórmula ni aumento. El tono puede variar según la iluminación, la cámara y el color natural de tu iris. Incluye recomendaciones de cuidado e higiene.`,
    price: money(spec.price ?? 49_000),
    compareAtPrice: spec.compareAt ? money(spec.compareAt) : null,
    colorFamily: family,
    categoryIds: spec.halloween ? ["cat-lentes", "cat-halloween"] : ["cat-lentes"],
    media: [{ id: `${spec.slug}-m0`, url: LENS_IMG, altText: `Lente ${spec.name}`, order: 0, isVideoPoster: false }],
    badges,
    stock,
    allowBackorder: false,
    featured: Boolean(spec.featured),
    publishedAt: daysAgoIso(spec.publishedDaysAgo),
    purchaseLimit: null,
  };
}

const accessories: Product[] = [
  {
    id: "prod-solucion-120",
    slug: "solucion-multiproposito-120ml",
    sku: "SPC-ACC-001",
    status: "active",
    name: "Solución multipropósito 120ml",
    shortDescription: "Limpieza, enjuague y almacenamiento diario.",
    description: "Solución salina para el cuidado diario de lentes de contacto cosméticos.",
    price: money(28_000),
    compareAtPrice: null,
    colorFamily: null,
    categoryIds: ["cat-accesorios"],
    media: [{ id: "sol-m0", url: ACC_IMG, altText: "Solución multipropósito", order: 0, isVideoPoster: false }],
    badges: [],
    stock: 40,
    allowBackorder: false,
    featured: false,
    publishedAt: daysAgoIso(200),
    purchaseLimit: null,
  },
  {
    id: "prod-pinza",
    slug: "pinza-y-aplicador",
    sku: "SPC-ACC-002",
    status: "active",
    name: "Pinza y aplicador",
    shortDescription: "Set de herramientas para poner y quitar tus lentes con higiene.",
    description: "Incluye pinza de punta redondeada y aplicador de succión.",
    price: money(15_000),
    compareAtPrice: null,
    colorFamily: null,
    categoryIds: ["cat-accesorios"],
    media: [{ id: "pin-m0", url: ACC_IMG, altText: "Pinza y aplicador", order: 0, isVideoPoster: false }],
    badges: [],
    stock: 55,
    allowBackorder: false,
    featured: false,
    publishedAt: daysAgoIso(200),
    purchaseLimit: null,
  },
  {
    id: "prod-estuche",
    slug: "estuche-doble",
    sku: "SPC-ACC-003",
    status: "active",
    name: "Estuche doble",
    shortDescription: "Estuche higiénico para guardar tus lentes.",
    description: "Estuche de doble compartimiento con identificación izquierda/derecha.",
    price: money(9_000),
    compareAtPrice: null,
    colorFamily: null,
    categoryIds: ["cat-accesorios"],
    media: [{ id: "est-m0", url: ACC_IMG, altText: "Estuche doble", order: 0, isVideoPoster: false }],
    badges: [],
    stock: 80,
    allowBackorder: false,
    featured: false,
    publishedAt: daysAgoIso(200),
    purchaseLimit: null,
  },
];

export const products: Product[] = [...LENS_SPECS.map(buildLens), ...accessories];

export const collections: Collection[] = [
  { id: "col-mas-vendidos", slug: "mas-vendidos", name: "Más vendidos", description: "Los tonos preferidos por nuestras clientas este mes." },
  { id: "col-novedades", slug: "novedades", name: "Novedades", description: "Lo más nuevo de nuestra colección." },
];

/** Miembros de colección (equivalente a collection_products). */
export const collectionMembership: Record<string, string[]> = {
  "mas-vendidos": ["prod-amazon-brown", "prod-oslo", "prod-boreal", "prod-honey-glow", "prod-ocean"],
  novedades: ["prod-boreal", "prod-denim"],
};

/** Reglas de upsell/accesorios sugeridos (equivalente a recommendation_rules). */
export const accessoryProductIds = ["prod-solucion-120", "prod-pinza", "prod-estuche"];

/** Cupones de ejemplo ACTIVOS para poder probar el flujo en la Fase 2. */
export const coupons: Coupon[] = [
  {
    id: "demo-coupon-bienvenida10",
    code: "BIENVENIDA10",
    discountType: "percentage",
    discountValue: 10,
    startsAt: null,
    endsAt: null,
    minPurchaseAmount: null,
    minQuantity: null,
    usageLimitTotal: null,
    usageLimitPerCustomer: null,
    firstOrderOnly: false,
    status: "active",
  },
  {
    id: "demo-coupon-enviogratis",
    code: "ENVIOGRATIS",
    discountType: "free_shipping",
    discountValue: 0,
    startsAt: null,
    endsAt: null,
    minPurchaseAmount: money(80_000),
    minQuantity: null,
    usageLimitTotal: null,
    usageLimitPerCustomer: null,
    firstOrderOnly: false,
    status: "active",
  },
];

/** Reglas de recompensa de ejemplo (barra de progreso). */
export const rewardRules: RewardRule[] = [
  {
    id: "rw-envio-gratis",
    name: "Envío gratis sobre $150.000",
    progressMessage: "Agrega {remaining} más y tienes envío gratis",
    unlockedMessage: "¡Genial! Tienes envío gratis",
    conditionType: "cart_amount",
    targetValue: 150_000,
    rewardType: "free_shipping",
    rewardValue: null,
    rewardProductId: null,
    eligibleZoneIds: null,
    priority: 10,
    status: "active",
  },
];
