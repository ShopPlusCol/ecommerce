"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import {
  auditLogs,
  categories,
  collections,
  colorFamilies,
  coupons,
  faqs,
  popups,
  promotions,
  rewardRules,
  shippingRules,
  shippingZones,
  testimonials,
} from "@/infrastructure/db/schema";

const requestSchema = z.object({
  entity: z.enum([
    "category",
    "colorFamily",
    "collection",
    "shippingZone",
    "shippingRule",
    "promotion",
    "coupon",
    "rewardRule",
    "popup",
    "faq",
    "testimonial",
  ]),
  operation: z.enum(["create", "update", "archive", "duplicate"]),
  id: z.string().optional(),
});

const permissions: Record<z.infer<typeof requestSchema>["entity"], string> = {
  category: "catalog",
  colorFamily: "catalog",
  collection: "catalog",
  shippingZone: "shipping",
  shippingRule: "shipping",
  promotion: "promotions",
  coupon: "promotions",
  rewardRule: "promotions",
  popup: "promotions",
  faq: "content",
  testimonial: "content",
};

const paths: Record<z.infer<typeof requestSchema>["entity"], string> = {
  category: "/admin/categorias",
  colorFamily: "/admin/categorias",
  collection: "/admin/colecciones",
  shippingZone: "/admin/envios",
  shippingRule: "/admin/envios",
  promotion: "/admin/promociones",
  coupon: "/admin/cupones",
  rewardRule: "/admin/recompensas",
  popup: "/admin/popups",
  faq: "/admin/contenido",
  testimonial: "/admin/contenido",
};

function text(formData: FormData, name: string, required = false) {
  const value = String(formData.get(name) ?? "").trim();
  if (required && !value) throw new Error(`El campo ${name} es obligatorio.`);
  return value || null;
}

function integer(formData: FormData, name: string, fallback = 0) {
  const raw = text(formData, name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) throw new Error(`El campo ${name} debe ser un número entero.`);
  return value;
}

function optionalInteger(formData: FormData, name: string) {
  const raw = text(formData, name);
  if (raw === null) return null;
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) throw new Error(`El campo ${name} debe ser un número entero.`);
  return value;
}

function bool(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function date(formData: FormData, name: string) {
  const raw = text(formData, name);
  if (!raw) return null;
  const value = new Date(raw);
  if (Number.isNaN(value.valueOf())) throw new Error(`La fecha ${name} no es válida.`);
  return value;
}

function list(formData: FormData, name: string) {
  const raw = text(formData, name);
  return raw ? raw.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function slugCopy(value: string) {
  return `${value}-copia-${Date.now().toString(36)}`;
}

export async function adminEntityAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const request = requestSchema.parse({
      entity: formData.get("entity"),
      operation: formData.get("operation"),
      id: text(formData, "id") ?? undefined,
    });
    if (request.operation !== "create" && !request.id) throw new Error("Falta el identificador del registro.");
    const action = request.operation === "archive" ? "delete" : request.operation === "create" || request.operation === "duplicate" ? "create" : "update";
    const session = await requirePermission(permissions[request.entity], action);
    const db = await getRuntimeDb();
    const now = new Date();
    let entityId = request.id ?? "";
    let before: Record<string, unknown> | undefined;
    let after: Record<string, unknown> | undefined;

    switch (request.entity) {
      case "category": {
        if (request.operation === "duplicate") {
          const [source] = await db.select().from(categories).where(eq(categories.id, request.id!)).limit(1);
          if (!source) throw new Error("La categoría ya no existe.");
          const [created] = await db.insert(categories).values({ ...source, id: undefined, slug: slugCopy(source.slug), name: `${source.name} (copia)`, archivedAt: null, createdAt: now, updatedAt: now }).returning();
          entityId = created.id; after = created;
        } else if (request.operation === "archive") {
          const [source] = await db.select().from(categories).where(eq(categories.id, request.id!)).limit(1);
          if (!source) throw new Error("La categoría ya no existe.");
          before = source; await db.update(categories).set({ archivedAt: now, visibleInMenu: false, visibleInFilters: false, updatedAt: now }).where(eq(categories.id, source.id)); after = { archivedAt: now };
        } else {
          const values = {
            name: text(formData, "name", true)!,
            slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug no es válido.").parse(text(formData, "slug", true)),
            description: text(formData, "description"),
            seoTitle: text(formData, "seoTitle"),
            seoDescription: text(formData, "seoDescription"),
            parentId: text(formData, "parentId"),
            imageUrl: text(formData, "imageUrl"),
            order: integer(formData, "order"),
            visibleInMenu: bool(formData, "visibleInMenu"),
            visibleInFilters: bool(formData, "visibleInFilters"),
            archivedAt: null,
            updatedAt: now,
          };
          if (request.operation === "create") {
            const [created] = await db.insert(categories).values(values).returning(); entityId = created.id; after = created;
          } else {
            [before] = await db.select().from(categories).where(eq(categories.id, request.id!)).limit(1); await db.update(categories).set(values).where(eq(categories.id, request.id!)); after = values;
          }
        }
        break;
      }
      case "colorFamily": {
        const values = {
          name: text(formData, "name", true)!,
          slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).parse(text(formData, "slug", true)),
          hexSwatch: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().parse(text(formData, "hexSwatch")),
          order: integer(formData, "order"),
          updatedAt: now,
        };
        if (request.operation === "create") { const [created] = await db.insert(colorFamilies).values(values).returning(); entityId = created.id; after = created; }
        else if (request.operation === "update") { [before] = await db.select().from(colorFamilies).where(eq(colorFamilies.id, request.id!)).limit(1); await db.update(colorFamilies).set(values).where(eq(colorFamilies.id, request.id!)); after = values; }
        else if (request.operation === "duplicate") {
          const [source] = await db.select().from(colorFamilies).where(eq(colorFamilies.id, request.id!)).limit(1); if (!source) throw new Error("La familia ya no existe.");
          const [created] = await db.insert(colorFamilies).values({ ...source, id: undefined, slug: slugCopy(source.slug), name: `${source.name} (copia)`, createdAt: now, updatedAt: now }).returning(); entityId = created.id; after = created;
        } else throw new Error("Las familias en uso no se eliminan; edítala o reasigna sus productos.");
        break;
      }
      case "collection": {
        if (request.operation === "duplicate") {
          const [source] = await db.select().from(collections).where(eq(collections.id, request.id!)).limit(1); if (!source) throw new Error("La colección ya no existe.");
          const [created] = await db.insert(collections).values({ ...source, id: undefined, slug: slugCopy(source.slug), name: `${source.name} (copia)`, featured: false, createdAt: now, updatedAt: now }).returning(); entityId = created.id; after = created;
        } else if (request.operation === "archive") {
          [before] = await db.select().from(collections).where(eq(collections.id, request.id!)).limit(1); await db.update(collections).set({ featured: false, endsAt: now, updatedAt: now }).where(eq(collections.id, request.id!)); after = { featured: false, endsAt: now };
        } else {
          const values = { name: text(formData, "name", true)!, slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).parse(text(formData, "slug", true)), description: text(formData, "description"), type: z.enum(["manual", "dynamic"]).parse(text(formData, "type", true)), featured: bool(formData, "featured"), startsAt: date(formData, "startsAt"), endsAt: date(formData, "endsAt"), updatedAt: now };
          if (request.operation === "create") { const [created] = await db.insert(collections).values(values).returning(); entityId = created.id; after = created; }
          else { [before] = await db.select().from(collections).where(eq(collections.id, request.id!)).limit(1); await db.update(collections).set(values).where(eq(collections.id, request.id!)); after = values; }
        }
        break;
      }
      case "shippingZone": {
        const values = { name: text(formData, "name", true)!, level: z.enum(["country", "department", "city", "neighborhood"]).parse(text(formData, "level", true)), country: text(formData, "country") ?? "CO", department: text(formData, "department"), city: text(formData, "city"), neighborhood: text(formData, "neighborhood"), status: z.enum(["active", "inactive"]).parse(text(formData, "status", true)), updatedAt: now };
        if (request.operation === "create") { const [created] = await db.insert(shippingZones).values(values).returning(); entityId = created.id; after = created; }
        else if (request.operation === "update") { [before] = await db.select().from(shippingZones).where(eq(shippingZones.id, request.id!)).limit(1); await db.update(shippingZones).set(values).where(eq(shippingZones.id, request.id!)); after = values; }
        else if (request.operation === "archive") { [before] = await db.select().from(shippingZones).where(eq(shippingZones.id, request.id!)).limit(1); await db.update(shippingZones).set({ status: "inactive", updatedAt: now }).where(eq(shippingZones.id, request.id!)); after = { status: "inactive" }; }
        else throw new Error("Duplica reglas concretas, no zonas completas.");
        break;
      }
      case "shippingRule": {
        const values = { zoneId: text(formData, "zoneId", true)!, name: text(formData, "name", true)!, fee: integer(formData, "fee"), freeShippingThreshold: optionalInteger(formData, "freeShippingThreshold"), cashOnDeliveryAllowed: bool(formData, "cashOnDeliveryAllowed"), requiresAdvancePayment: bool(formData, "requiresAdvancePayment"), advancePercentage: optionalInteger(formData, "advancePercentage"), sameDayAvailable: bool(formData, "sameDayAvailable"), sameDayCutoffHour: optionalInteger(formData, "sameDayCutoffHour"), estimatedBusinessDaysMin: integer(formData, "estimatedBusinessDaysMin", 1), estimatedBusinessDaysMax: integer(formData, "estimatedBusinessDaysMax", 3), surcharge: integer(formData, "surcharge"), minOrderAmount: optionalInteger(formData, "minOrderAmount"), maxOrderAmount: optionalInteger(formData, "maxOrderAmount"), customerMessage: text(formData, "customerMessage"), internalInstructions: text(formData, "internalInstructions"), priority: integer(formData, "priority"), status: z.enum(["draft", "active", "inactive"]).parse(text(formData, "status", true)), startsAt: date(formData, "startsAt"), endsAt: date(formData, "endsAt"), updatedAt: now };
        if (values.estimatedBusinessDaysMax < values.estimatedBusinessDaysMin) throw new Error("El plazo máximo no puede ser menor que el mínimo.");
        if (request.operation === "create") { const [created] = await db.insert(shippingRules).values(values).returning(); entityId = created.id; after = created; }
        else if (request.operation === "update") { [before] = await db.select().from(shippingRules).where(eq(shippingRules.id, request.id!)).limit(1); await db.update(shippingRules).set(values).where(eq(shippingRules.id, request.id!)); after = values; }
        else if (request.operation === "archive") { [before] = await db.select().from(shippingRules).where(eq(shippingRules.id, request.id!)).limit(1); await db.update(shippingRules).set({ status: "inactive", updatedAt: now }).where(eq(shippingRules.id, request.id!)); after = { status: "inactive" }; }
        else {
          const [source] = await db.select().from(shippingRules).where(eq(shippingRules.id, request.id!)).limit(1); if (!source) throw new Error("La regla ya no existe.");
          const [created] = await db.insert(shippingRules).values({ ...source, id: undefined, name: `${source.name} (copia)`, status: "draft", createdAt: now, updatedAt: now }).returning(); entityId = created.id; after = created;
        }
        break;
      }
      case "promotion": {
        const values = { name: text(formData, "name", true)!, description: text(formData, "description"), bannerImageUrl: text(formData, "bannerImageUrl"), relatedCouponIds: list(formData, "relatedCouponIds"), relatedRewardRuleIds: list(formData, "relatedRewardRuleIds"), startsAt: date(formData, "startsAt"), endsAt: date(formData, "endsAt"), status: z.enum(["draft", "scheduled", "active", "ended"]).parse(text(formData, "status", true)), updatedAt: now };
        if (request.operation === "create") { const [created] = await db.insert(promotions).values(values).returning(); entityId = created.id; after = created; }
        else if (request.operation === "update") { [before] = await db.select().from(promotions).where(eq(promotions.id, request.id!)).limit(1); await db.update(promotions).set(values).where(eq(promotions.id, request.id!)); after = values; }
        else if (request.operation === "archive") { [before] = await db.select().from(promotions).where(eq(promotions.id, request.id!)).limit(1); await db.update(promotions).set({ status: "ended", endsAt: now, updatedAt: now }).where(eq(promotions.id, request.id!)); after = { status: "ended" }; }
        else { const [source] = await db.select().from(promotions).where(eq(promotions.id, request.id!)).limit(1); if (!source) throw new Error("La promoción ya no existe."); const [created] = await db.insert(promotions).values({ ...source, id: undefined, name: `${source.name} (copia)`, status: "draft", startsAt: null, endsAt: null, createdAt: now, updatedAt: now }).returning(); entityId = created.id; after = created; }
        break;
      }
      case "coupon": {
        const values = { code: z.string().trim().min(3).max(40).regex(/^[A-Z0-9_-]+$/).parse(String(formData.get("code") ?? "").toUpperCase()), discountType: z.enum(["fixed", "percentage", "free_shipping", "gift"]).parse(text(formData, "discountType", true)), discountValue: integer(formData, "discountValue"), startsAt: date(formData, "startsAt"), endsAt: date(formData, "endsAt"), usageLimitTotal: optionalInteger(formData, "usageLimitTotal"), usageLimitPerCustomer: optionalInteger(formData, "usageLimitPerCustomer"), minPurchaseAmount: optionalInteger(formData, "minPurchaseAmount"), minQuantity: optionalInteger(formData, "minQuantity"), firstOrderOnly: bool(formData, "firstOrderOnly"), combinable: bool(formData, "combinable"), priority: integer(formData, "priority"), status: z.enum(["draft", "scheduled", "active", "paused", "expired"]).parse(text(formData, "status", true)), attributedTo: text(formData, "attributedTo"), internalTags: list(formData, "internalTags"), internalNotes: text(formData, "internalNotes"), updatedAt: now };
        if (values.discountType === "percentage" && (values.discountValue < 0 || values.discountValue > 100)) throw new Error("El porcentaje debe estar entre 0 y 100.");
        if (request.operation === "create") { const [created] = await db.insert(coupons).values(values).returning(); entityId = created.id; after = created; }
        else if (request.operation === "update") { [before] = await db.select().from(coupons).where(eq(coupons.id, request.id!)).limit(1); await db.update(coupons).set(values).where(eq(coupons.id, request.id!)); after = values; }
        else if (request.operation === "archive") { [before] = await db.select().from(coupons).where(eq(coupons.id, request.id!)).limit(1); await db.update(coupons).set({ status: "paused", updatedAt: now }).where(eq(coupons.id, request.id!)); after = { status: "paused" }; }
        else { const [source] = await db.select().from(coupons).where(eq(coupons.id, request.id!)).limit(1); if (!source) throw new Error("El cupón ya no existe."); const [created] = await db.insert(coupons).values({ ...source, id: undefined, code: `${source.code}_COPIA_${Date.now().toString(36).toUpperCase()}`, status: "draft", createdAt: now, updatedAt: now }).returning(); entityId = created.id; after = created; }
        break;
      }
      case "rewardRule": {
        const values = { name: text(formData, "name", true)!, progressMessage: text(formData, "progressMessage", true)!, unlockedMessage: text(formData, "unlockedMessage", true)!, conditionType: z.enum(["cart_amount", "item_count", "category", "zone", "campaign"]).parse(text(formData, "conditionType", true)), targetValue: integer(formData, "targetValue"), rewardType: z.enum(["free_shipping", "free_product", "fixed_discount", "percentage_discount"]).parse(text(formData, "rewardType", true)), rewardValue: optionalInteger(formData, "rewardValue"), rewardProductId: text(formData, "rewardProductId"), priority: integer(formData, "priority"), combinable: bool(formData, "combinable"), startsAt: date(formData, "startsAt"), endsAt: date(formData, "endsAt"), usageLimitTotal: optionalInteger(formData, "usageLimitTotal"), usageLimitPerCustomer: optionalInteger(formData, "usageLimitPerCustomer"), status: z.enum(["draft", "active", "paused"]).parse(text(formData, "status", true)), updatedAt: now };
        if (request.operation === "create") { const [created] = await db.insert(rewardRules).values(values).returning(); entityId = created.id; after = created; }
        else if (request.operation === "update") { [before] = await db.select().from(rewardRules).where(eq(rewardRules.id, request.id!)).limit(1); await db.update(rewardRules).set(values).where(eq(rewardRules.id, request.id!)); after = values; }
        else if (request.operation === "archive") { [before] = await db.select().from(rewardRules).where(eq(rewardRules.id, request.id!)).limit(1); await db.update(rewardRules).set({ status: "paused", updatedAt: now }).where(eq(rewardRules.id, request.id!)); after = { status: "paused" }; }
        else { const [source] = await db.select().from(rewardRules).where(eq(rewardRules.id, request.id!)).limit(1); if (!source) throw new Error("La recompensa ya no existe."); const [created] = await db.insert(rewardRules).values({ ...source, id: undefined, name: `${source.name} (copia)`, status: "draft", createdAt: now, updatedAt: now }).returning(); entityId = created.id; after = created; }
        break;
      }
      case "popup": {
        const values = { name: text(formData, "name", true)!, imageUrlMobile: text(formData, "imageUrlMobile"), imageUrlDesktop: text(formData, "imageUrlDesktop"), title: text(formData, "title"), body: text(formData, "body"), ctaLabel: text(formData, "ctaLabel"), ctaHref: text(formData, "ctaHref"), couponId: text(formData, "couponId"), includedPaths: list(formData, "includedPaths"), excludedPaths: list(formData, "excludedPaths"), frequency: z.enum(["once_per_session", "once_per_period", "always"]).parse(text(formData, "frequency", true)), delaySeconds: integer(formData, "delaySeconds"), triggerOnScrollPercent: optionalInteger(formData, "triggerOnScrollPercent"), triggerOnExitIntent: bool(formData, "triggerOnExitIntent"), priority: integer(formData, "priority"), status: z.enum(["draft", "active", "paused", "expired"]).parse(text(formData, "status", true)), startsAt: date(formData, "startsAt"), endsAt: date(formData, "endsAt"), updatedAt: now };
        if (values.triggerOnScrollPercent !== null && (values.triggerOnScrollPercent < 0 || values.triggerOnScrollPercent > 100)) throw new Error("El porcentaje de desplazamiento debe estar entre 0 y 100.");
        if (request.operation === "create") { const [created] = await db.insert(popups).values(values).returning(); entityId = created.id; after = created; }
        else if (request.operation === "update") { [before] = await db.select().from(popups).where(eq(popups.id, request.id!)).limit(1); await db.update(popups).set(values).where(eq(popups.id, request.id!)); after = values; }
        else if (request.operation === "archive") { [before] = await db.select().from(popups).where(eq(popups.id, request.id!)).limit(1); await db.update(popups).set({ status: "paused", updatedAt: now }).where(eq(popups.id, request.id!)); after = { status: "paused" }; }
        else { const [source] = await db.select().from(popups).where(eq(popups.id, request.id!)).limit(1); if (!source) throw new Error("El pop-up ya no existe."); const [created] = await db.insert(popups).values({ ...source, id: undefined, name: `${source.name} (copia)`, status: "draft", createdAt: now, updatedAt: now }).returning(); entityId = created.id; after = created; }
        break;
      }
      case "faq": {
        const values = { question: text(formData, "question", true)!, answer: text(formData, "answer", true)!, category: text(formData, "category"), order: integer(formData, "order"), status: z.enum(["draft", "published"]).parse(text(formData, "status", true)), updatedAt: now };
        if (request.operation === "create") { const [created] = await db.insert(faqs).values(values).returning(); entityId = created.id; after = created; }
        else if (request.operation === "update") { [before] = await db.select().from(faqs).where(eq(faqs.id, request.id!)).limit(1); await db.update(faqs).set(values).where(eq(faqs.id, request.id!)); after = values; }
        else if (request.operation === "archive") { [before] = await db.select().from(faqs).where(eq(faqs.id, request.id!)).limit(1); await db.update(faqs).set({ status: "draft", updatedAt: now }).where(eq(faqs.id, request.id!)); after = { status: "draft" }; }
        else { const [source] = await db.select().from(faqs).where(eq(faqs.id, request.id!)).limit(1); if (!source) throw new Error("La pregunta ya no existe."); const [created] = await db.insert(faqs).values({ ...source, id: undefined, question: `${source.question} (copia)`, status: "draft", createdAt: now, updatedAt: now }).returning(); entityId = created.id; after = created; }
        break;
      }
      case "testimonial": {
        const rating = optionalInteger(formData, "rating");
        if (rating !== null && (rating < 1 || rating > 5)) throw new Error("La calificación debe estar entre 1 y 5.");
        const values = { customerName: text(formData, "customerName", true)!, city: text(formData, "city"), quote: text(formData, "quote", true)!, rating, order: integer(formData, "order"), status: z.enum(["draft", "published"]).parse(text(formData, "status", true)), updatedAt: now };
        if (request.operation === "create") { const [created] = await db.insert(testimonials).values(values).returning(); entityId = created.id; after = created; }
        else if (request.operation === "update") { [before] = await db.select().from(testimonials).where(eq(testimonials.id, request.id!)).limit(1); await db.update(testimonials).set(values).where(eq(testimonials.id, request.id!)); after = values; }
        else if (request.operation === "archive") { [before] = await db.select().from(testimonials).where(eq(testimonials.id, request.id!)).limit(1); await db.update(testimonials).set({ status: "draft", updatedAt: now }).where(eq(testimonials.id, request.id!)); after = { status: "draft" }; }
        else { const [source] = await db.select().from(testimonials).where(eq(testimonials.id, request.id!)).limit(1); if (!source) throw new Error("El testimonio ya no existe."); const [created] = await db.insert(testimonials).values({ ...source, id: undefined, customerName: `${source.customerName} (copia)`, status: "draft", createdAt: now, updatedAt: now }).returning(); entityId = created.id; after = created; }
        break;
      }
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: `${request.entity}.${request.operation}`,
      entityType: request.entity,
      entityId,
      before,
      after,
      reason: request.operation === "archive" ? text(formData, "reason", true) : null,
    });
    revalidatePath(paths[request.entity]);
    revalidatePath("/", "layout");
    return { status: "success", message: request.operation === "create" ? "Registro creado." : request.operation === "update" ? "Cambios guardados." : request.operation === "duplicate" ? "Copia creada como borrador." : "Registro archivado." };
  } catch (error) {
    return actionError(error);
  }
}
