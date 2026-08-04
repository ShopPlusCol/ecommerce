"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, integrationSettings } from "@/infrastructure/db/schema";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { requirePermission } from "@/modules/auth/session";
import { recoverPendingPurchaseEvents } from "@/modules/analytics/purchase-event";

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

/**
 * Reintenta las compras que no llegaron a Meta y cuyo reintento ya venció.
 *
 * No hay planificador en la arquitectura, así que esta es la vía manual: si
 * Meta tuvo una caída, el propietario la ejecuta desde el panel y las
 * compras pendientes se recuperan. Es segura de pulsar varias veces — cada
 * evento se reclama atómicamente, de modo que no puede duplicar una compra
 * ni reenviar una ya entregada.
 */
// Sin parámetros a propósito: no necesita ni el estado previo ni el
// formulario. `useActionState` acepta una acción con menos parámetros.
export async function recoverPendingPurchasesAction(): Promise<AdminActionState> {
  try {
    const session = await requirePermission("integrations", "update");
    const summary = await recoverPendingPurchaseEvents({ limit: 100 });
    const db = await getRuntimeDb();
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "integration.purchase.recover",
      entityType: "integration",
      entityId: "meta_conversions_api",
      after: summary,
    });
    revalidatePath("/admin/integraciones");

    if (summary.considered === 0) {
      return { status: "success", message: "No hay compras pendientes de enviar." };
    }
    return {
      status: summary.failed > 0 ? "error" : "success",
      message:
        `Compras pendientes revisadas: ${summary.considered}. Enviadas: ${summary.sent}.` +
        (summary.failed > 0
          ? ` ${summary.failed} volvieron a fallar y quedan programadas para otro reintento.`
          : ""),
    };
  } catch (error) {
    return actionError(error);
  }
}

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
