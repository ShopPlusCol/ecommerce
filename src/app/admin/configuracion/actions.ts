"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, settings } from "@/infrastructure/db/schema";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";

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
