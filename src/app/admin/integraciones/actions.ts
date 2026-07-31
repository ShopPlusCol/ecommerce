"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, integrationSettings } from "@/infrastructure/db/schema";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { requirePermission } from "@/modules/auth/session";

const providerSchema = z.enum(["mercado_pago", "meta_conversions_api", "whatsapp", "smtp"]);
const requirements: Record<z.infer<typeof providerSchema>, Array<{ key: string; present: () => boolean }>> = {
  mercado_pago: [
    { key: "MERCADO_PAGO_ACCESS_TOKEN", present: () => Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN) },
    { key: "MERCADO_PAGO_WEBHOOK_SECRET", present: () => Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET) },
  ],
  meta_conversions_api: [
    { key: "META_CONVERSIONS_ACCESS_TOKEN", present: () => Boolean(process.env.META_CONVERSIONS_ACCESS_TOKEN) },
    { key: "META_PIXEL_ID", present: () => Boolean(process.env.META_PIXEL_ID) },
  ],
  whatsapp: [{ key: "NEXT_PUBLIC_WHATSAPP_NUMBER", present: () => Boolean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) }],
  smtp: [
    { key: "SMTP_HOST", present: () => Boolean(process.env.SMTP_HOST) },
    { key: "SMTP_USER", present: () => Boolean(process.env.SMTP_USER) },
    { key: "SMTP_PASSWORD", present: () => Boolean(process.env.SMTP_PASSWORD) },
  ],
};

export async function updateIntegrationAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("integrations", "update");
    const provider = providerSchema.parse(formData.get("provider"));
    const operation = z.enum(["save", "diagnose"]).parse(formData.get("operation"));
    const db = await getRuntimeDb();
    const [before] = await db.select().from(integrationSettings).where(eq(integrationSettings.provider, provider)).limit(1);
    const missing = requirements[provider].filter((item) => !item.present()).map((item) => item.key);
    const isEnabled = formData.get("isEnabled") === "on";
    if (operation === "save" && isEnabled && missing.length) throw new Error(`No se puede activar: faltan ${missing.join(", ")}.`);
    const metadata = {
      ...(before?.metadata ?? {}),
      diagnostic: missing.length ? "configuration_missing" : "local_configuration_present",
      missingVariables: missing,
      note: "Comprobación local; no contacta al proveedor externo.",
    };
    await db.insert(integrationSettings).values({
      provider,
      isEnabled: operation === "save" ? isEnabled : before?.isEnabled ?? false,
      isTestMode: operation === "save" ? formData.get("isTestMode") === "on" : before?.isTestMode ?? true,
      metadata,
      lastCheckedAt: new Date(),
    }).onConflictDoUpdate({
      target: integrationSettings.provider,
      set: {
        isEnabled: operation === "save" ? isEnabled : before?.isEnabled ?? false,
        isTestMode: operation === "save" ? formData.get("isTestMode") === "on" : before?.isTestMode ?? true,
        metadata,
        lastCheckedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await db.insert(auditLogs).values({ userId: session.user.id, action: `integration.${operation}`, entityType: "integration", entityId: provider, before: before ? { isEnabled: before.isEnabled, isTestMode: before.isTestMode } : undefined, after: { isEnabled, missingVariables: missing } });
    revalidatePath("/admin/integraciones");
    revalidatePath("/admin/estado");
    return { status: missing.length ? "error" : "success", message: missing.length ? `Comprobación local: faltan ${missing.join(", ")}. No se realizó una prueba externa.` : "Variables requeridas presentes. Esto no confirma conectividad externa." };
  } catch (error) {
    return actionError(error);
  }
}
