import { z } from "zod";
import type { Block } from "./blocks";

export const blockTypes = [
  "hero",
  "color_families",
  "product_collection",
  "benefits",
  "image_text",
  "testimonials",
  "faq",
  "cta",
] as const;

export type BlockType = (typeof blockTypes)[number];

export const blockTypeLabels: Record<BlockType, string> = {
  hero: "Portada",
  color_families: "Familias de color",
  product_collection: "Colección de productos",
  benefits: "Beneficios",
  image_text: "Imagen y texto",
  testimonials: "Testimonios",
  faq: "Preguntas frecuentes",
  cta: "Llamado a la acción",
};

const link = z.string().trim().startsWith("/", "Usa una ruta interna que empiece por /.");
const item = z.object({ title: z.string().trim().min(1), body: z.string().trim().min(1) });

const schemas = {
  hero: z.object({
    eyebrow: z.string().trim().optional(),
    title: z.string().trim().min(1),
    subtitle: z.string().trim().min(1),
    ctaLabel: z.string().trim().min(1),
    ctaHref: link,
    secondaryLabel: z.string().trim().optional(),
    secondaryHref: link.optional(),
  }),
  color_families: z.object({ title: z.string().trim().min(1) }),
  product_collection: z.object({
    title: z.string().trim().min(1),
    source: z.union([
      z.object({ collectionSlug: z.string().trim().min(1) }),
      z.object({ filter: z.enum(["featured", "promotion", "newest", "best_selling"]) }),
    ]),
    limit: z.number().int().min(1).max(24),
    viewAllHref: link.optional(),
    tone: z.enum(["default", "sunken"]).optional(),
  }),
  benefits: z.object({ items: z.array(item).min(1).max(8) }),
  image_text: z.object({
    title: z.string().trim().min(1),
    body: z.string().trim().min(1),
    imageUrl: z.string().trim().nullable(),
    ctaLabel: z.string().trim().optional(),
    ctaHref: link.optional(),
    reverse: z.boolean().optional(),
  }),
  testimonials: z.object({
    title: z.string().trim().min(1),
    items: z.array(z.object({
      name: z.string().trim().min(1),
      city: z.string().trim(),
      quote: z.string().trim().min(1),
    })).min(1).max(12),
  }),
  faq: z.object({
    title: z.string().trim().min(1),
    items: z.array(z.object({
      question: z.string().trim().min(1),
      answer: z.string().trim().min(1),
    })).min(1).max(20),
    viewAllHref: link.optional(),
  }),
  cta: z.object({
    title: z.string().trim().min(1),
    ctaLabel: z.string().trim().min(1),
    ctaHref: link,
  }),
} satisfies Record<BlockType, z.ZodType>;

export function defaultBlockConfig(type: BlockType): Record<string, unknown> {
  switch (type) {
    case "hero":
      return { eyebrow: "Nueva colección", title: "Título principal", subtitle: "Explica aquí el valor de esta página.", ctaLabel: "Ver catálogo", ctaHref: "/catalogo" };
    case "color_families":
      return { title: "Elige por tono" };
    case "product_collection":
      return { title: "Productos destacados", source: { filter: "featured" }, limit: 4, tone: "default" };
    case "benefits":
      return { items: [{ title: "Beneficio principal", body: "Describe brevemente este beneficio." }] };
    case "image_text":
      return { title: "Título de la sección", body: "Agrega el contenido de esta sección.", imageUrl: null, reverse: false };
    case "testimonials":
      return { title: "Lo que dicen nuestras clientas", items: [{ name: "Cliente", city: "Medellín", quote: "Escribe aquí el testimonio." }] };
    case "faq":
      return { title: "Preguntas frecuentes", items: [{ question: "¿Cuál es la pregunta?", answer: "Escribe aquí la respuesta." }] };
    case "cta":
      return { title: "¿Lista para continuar?", ctaLabel: "Ver catálogo", ctaHref: "/catalogo" };
  }
}

export function parseBlockConfig(type: string, value: unknown): Record<string, unknown> {
  if (!blockTypes.includes(type as BlockType)) throw new Error("El tipo de bloque no es compatible con la tienda.");
  return schemas[type as BlockType].parse(value) as Record<string, unknown>;
}

export function toBlock(section: {
  id: string;
  blockType: string;
  config: Record<string, unknown>;
  visibleOnMobile: boolean;
  visibleOnDesktop: boolean;
}): Block {
  return {
    id: section.id,
    type: section.blockType,
    config: parseBlockConfig(section.blockType, section.config),
    visibleOnMobile: section.visibleOnMobile,
    visibleOnDesktop: section.visibleOnDesktop,
  } as Block;
}
