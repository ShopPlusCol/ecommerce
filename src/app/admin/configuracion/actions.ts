"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, settings } from "@/infrastructure/db/schema";

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

export async function saveBrandSettingsAction(formData: FormData) {
  const session = await requirePermission("settings", "update");
  const parsed = brandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Revisa los campos de identidad de marca.");
  const db = await getRuntimeDb();
  const [before] = await db.select().from(settings).where(eq(settings.key, "brand")).limit(1);
  await db.insert(settings).values({
    key: "brand",
    value: parsed.data,
    updatedByUserId: session.user.id,
  }).onConflictDoUpdate({
    target: settings.key,
    set: { value: parsed.data, updatedByUserId: session.user.id, updatedAt: new Date() },
  });
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "settings.brand.update",
    entityType: "setting",
    entityId: "brand",
    before: before?.value as Record<string, unknown> | undefined,
    after: parsed.data,
  });
  revalidatePath("/", "layout");
}

export async function saveManualTransferSettingsAction(formData: FormData) {
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
}

export async function savePrivacySettingsAction(formData: FormData) {
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
}
