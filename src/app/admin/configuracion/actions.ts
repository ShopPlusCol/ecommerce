"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, settings } from "@/infrastructure/db/schema";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import type { PaymentMethodsSettings } from "@/modules/settings/payment-methods";
import type { SiteTextsSettings } from "@/modules/settings/site-texts";
import {
  CHECKOUT_FIELD_ID_VALUES,
  LOCKED_CHECKOUT_FIELDS,
  NO_REQUIRED_TOGGLE_FIELDS,
  checkoutFieldsConfigSchema,
  type CheckoutFieldConfig,
  type CheckoutFieldId,
} from "@/modules/checkout/checkout-fields";

const optionalUrl = z.union([
  z.literal(""),
  z.string().trim().refine((value) => value.startsWith("/") || URL.canParse(value), "La URL de imagen no es válida."),
]).transform((value) => value || null);
const brandSchema = z.object({
  name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(160),
  description: z.string().trim().max(320),
  mode: z.enum(["text", "image", "image_text"]),
  logoUrl: optionalUrl,
  mobileLogoUrl: optionalUrl,
  footerLogoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  appleTouchIconUrl: optionalUrl,
  openGraphImageUrl: optionalUrl,
  altText: z.string().trim().max(160),
  email: z.union([z.literal(""), z.string().email()]),
  whatsapp: z.string().trim().max(30),
  instagram: optionalUrl,
  facebook: optionalUrl,
  tiktok: optionalUrl,
});

export async function saveBrandSettingsAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("settings", "update");
    const parsed = brandSchema.parse(Object.fromEntries(formData));
    const db = await getRuntimeDb();
    const [before] = await db.select().from(settings).where(eq(settings.key, "brand")).limit(1);
    await db.insert(settings).values({
      key: "brand",
      value: parsed,
      updatedByUserId: session.user.id,
    }).onConflictDoUpdate({
      target: settings.key,
      set: { value: parsed, updatedByUserId: session.user.id, updatedAt: new Date() },
    });
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "settings.brand.update",
      entityType: "setting",
      entityId: "brand",
      before: before?.value as Record<string, unknown> | undefined,
      after: parsed,
    });
    revalidatePath("/", "layout");
    return { status: "success", message: "Identidad visual guardada." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveManualTransferSettingsAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("settings", "update");
    const parsed = z.object({
      bankName: z.string().trim().max(100),
      accountType: z.string().trim().max(80),
      accountNumber: z.string().trim().max(80),
      accountHolder: z.string().trim().max(120),
      instructions: z.string().trim().max(500),
      qrUrl: optionalUrl,
    }).parse(Object.fromEntries(formData));
    const db = await getRuntimeDb();
    await db.insert(settings).values({ key: "manual_transfer", value: parsed, updatedByUserId: session.user.id })
      .onConflictDoUpdate({ target: settings.key, set: { value: parsed, updatedByUserId: session.user.id, updatedAt: new Date() } });
    await db.insert(auditLogs).values({ userId: session.user.id, action: "settings.manual_transfer.update", entityType: "setting", entityId: "manual_transfer", after: parsed });
    revalidatePath("/admin/configuracion");
    return { status: "success", message: "Transferencia manual guardada." };
  } catch (error) {
    return actionError(error);
  }
}

export async function savePrivacySettingsAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("settings", "update");
    const parsed = z.object({
      policyVersion: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
      controllerName: z.string().trim().min(1).max(160),
      legalId: z.string().trim().max(80),
      address: z.string().trim().max(240),
      privacyEmail: z.string().trim().email(),
      orderRetentionMonths: z.coerce.number().int().min(1).max(240),
      proofRetentionMonths: z.coerce.number().int().min(1).max(240),
      auditRetentionMonths: z.coerce.number().int().min(1).max(240),
      legalReviewStatus: z.enum(["pending", "reviewed"]),
    }).parse(Object.fromEntries(formData));
    const db = await getRuntimeDb();
    const [before] = await db.select().from(settings).where(eq(settings.key, "privacy")).limit(1);
    await db.insert(settings).values({ key: "privacy", value: parsed, updatedByUserId: session.user.id })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: parsed, updatedByUserId: session.user.id, updatedAt: new Date() },
      });
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "settings.privacy.update",
      entityType: "setting",
      entityId: "privacy",
      before: before?.value as Record<string, unknown> | undefined,
      after: parsed,
    });
    revalidatePath("/privacidad");
    revalidatePath("/admin/configuracion");
    return { status: "success", message: "Privacidad y retención guardadas." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveShippingMessagesSettingsAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("settings", "update");
    const parsed = z.object({
      noCoverageTemplate: z.string().trim().min(1, "Escribe un mensaje.").max(300).refine((value) => value.includes("{lugar}"), 'El mensaje debe incluir "{lugar}".'),
    }).parse(Object.fromEntries(formData));
    const db = await getRuntimeDb();
    await db.insert(settings).values({ key: "shipping_messages", value: parsed, updatedByUserId: session.user.id })
      .onConflictDoUpdate({ target: settings.key, set: { value: parsed, updatedByUserId: session.user.id, updatedAt: new Date() } });
    await db.insert(auditLogs).values({ userId: session.user.id, action: "settings.shipping_messages.update", entityType: "setting", entityId: "shipping_messages", after: parsed });
    revalidatePath("/admin/configuracion");
    return { status: "success", message: "Mensaje de envíos guardado." };
  } catch (error) {
    return actionError(error);
  }
}

const paymentMethodCopySchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre.").max(60),
  description: z.string().trim().max(200),
});

export async function saveSiteTextsSettingsAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("settings", "update");
    const parsed = z.object({
      headerAnnouncement: z.string().trim().min(1, "Escribe un texto.").max(140),
      whatsappInquiryTemplate: z.string().trim().min(1, "Escribe un texto.").max(200).refine((value) => value.includes("{marca}"), 'El mensaje debe incluir "{marca}".'),
      whatsappCartIntro: z.string().trim().min(1, "Escribe un texto.").max(140),
      whatsappCartClosingNote: z.string().trim().min(1, "Escribe un texto.").max(200),
      checkoutPaymentDisclaimer: z.string().trim().min(1, "Escribe un texto.").max(400),
      shippingPageMedellinBody: z.string().trim().min(1, "Escribe un texto.").max(400),
      shippingPageRestBody: z.string().trim().min(1, "Escribe un texto.").max(400),
      shippingPageNote: z.string().trim().min(1, "Escribe un texto.").max(400),
      productIncludes: z.string().trim().min(1, "Escribe un texto.").max(200),
      productExcludes: z.string().trim().min(1, "Escribe un texto.").max(200),
      productVariationNote: z.string().trim().min(1, "Escribe un texto.").max(400),
      whatsappProductTemplate: z
        .string()
        .trim()
        .min(1, "Escribe un texto.")
        .max(400)
        .refine((value) => value.includes("{producto}"), 'El mensaje debe incluir "{producto}".')
        .refine((value) => value.includes("{precio}"), 'El mensaje debe incluir "{precio}".'),
    }).parse(Object.fromEntries(formData)) satisfies SiteTextsSettings;
    const db = await getRuntimeDb();
    await db.insert(settings).values({ key: "site_texts", value: parsed, updatedByUserId: session.user.id })
      .onConflictDoUpdate({ target: settings.key, set: { value: parsed, updatedByUserId: session.user.id, updatedAt: new Date() } });
    await db.insert(auditLogs).values({ userId: session.user.id, action: "settings.site_texts.update", entityType: "setting", entityId: "site_texts", after: parsed });
    revalidatePath("/admin/configuracion");
    revalidatePath("/", "layout");
    return { status: "success", message: "Textos del sitio guardados." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveCheckoutFieldsSettingsAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("settings", "update");
    const orderRaw = z.string().min(1, "Falta el orden de los campos.").parse(formData.get("order"));
    let parsedOrder: unknown;
    try {
      parsedOrder = JSON.parse(orderRaw);
    } catch {
      throw new Error("El orden de campos no es válido.");
    }
    const order = z.array(z.enum(CHECKOUT_FIELD_ID_VALUES)).parse(parsedOrder);
    if (order.length !== CHECKOUT_FIELD_ID_VALUES.length || new Set(order).size !== CHECKOUT_FIELD_ID_VALUES.length) {
      throw new Error("El orden de campos no es válido.");
    }
    const fields: CheckoutFieldConfig[] = order.map((id, index) => {
      const locked = (LOCKED_CHECKOUT_FIELDS as readonly CheckoutFieldId[]).includes(id);
      const noRequiredToggle = (NO_REQUIRED_TOGGLE_FIELDS as readonly CheckoutFieldId[]).includes(id);
      const enabled = locked ? true : formData.get(`${id}_enabled`) === "on";
      const required = locked ? true : noRequiredToggle ? false : formData.get(`${id}_required`) === "on";
      return { id, enabled, required, order: index };
    });
    // Misma definición de validación que la lectura (getCheckoutFieldsSettings):
    // si esto no pasa, es un bug en la construcción de arriba, no un dato de
    // usuario — mejor fallar aquí que persistir algo que el checkout luego
    // rechazaría de todas formas.
    checkoutFieldsConfigSchema.parse(fields);
    const db = await getRuntimeDb();
    await db.insert(settings).values({ key: "checkout_fields", value: fields, updatedByUserId: session.user.id })
      .onConflictDoUpdate({ target: settings.key, set: { value: fields, updatedByUserId: session.user.id, updatedAt: new Date() } });
    await db.insert(auditLogs).values({ userId: session.user.id, action: "settings.checkout_fields.update", entityType: "setting", entityId: "checkout_fields", after: { fields } });
    revalidatePath("/admin/configuracion");
    revalidatePath("/checkout");
    return { status: "success", message: "Formulario de checkout guardado." };
  } catch (error) {
    return actionError(error);
  }
}

export async function savePaymentMethodsSettingsAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("settings", "update");
    const ids = ["mercado_pago", "cash_on_delivery", "shipping_advance_transfer", "transfer_full"] as const;
    const parsed = {} as PaymentMethodsSettings;
    for (const id of ids) {
      parsed[id] = paymentMethodCopySchema.parse({
        name: formData.get(`${id}_name`),
        description: formData.get(`${id}_description`),
      });
    }
    const db = await getRuntimeDb();
    await db.insert(settings).values({ key: "payment_methods", value: parsed, updatedByUserId: session.user.id })
      .onConflictDoUpdate({ target: settings.key, set: { value: parsed, updatedByUserId: session.user.id, updatedAt: new Date() } });
    await db.insert(auditLogs).values({ userId: session.user.id, action: "settings.payment_methods.update", entityType: "setting", entityId: "payment_methods", after: parsed });
    revalidatePath("/admin/configuracion");
    revalidatePath("/checkout");
    return { status: "success", message: "Métodos de pago guardados." };
  } catch (error) {
    return actionError(error);
  }
}
