"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, shippingRules, shippingZones } from "@/infrastructure/db/schema";
import { normalize } from "@/domain/services/shipping";

type Db = Awaited<ReturnType<typeof getRuntimeDb>>;

const ZONE_LEVEL_LABELS = {
  country: "País",
  department: "Departamento",
  city: "Ciudad/Municipio",
  neighborhood: "Barrio",
} as const;

const CREATABLE_LEVELS = ["department", "city", "neighborhood"] as const;
const CHILD_LEVEL: Record<"department" | "city", "city" | "neighborhood"> = {
  department: "city",
  city: "neighborhood",
};

function refresh() {
  revalidatePath("/admin/envios");
}

async function loadZone(db: Db, zoneId: string) {
  const [zone] = await db.select().from(shippingZones).where(eq(shippingZones.id, zoneId)).limit(1);
  if (!zone) throw new Error("La zona ya no existe.");
  return zone;
}

type ZoneLevel = "country" | "department" | "city" | "neighborhood";

async function assertUniqueSiblingName(db: Db, level: ZoneLevel, parentZoneId: string | null, name: string, excludeId?: string) {
  const siblings = await db
    .select()
    .from(shippingZones)
    .where(parentZoneId ? and(eq(shippingZones.parentZoneId, parentZoneId), eq(shippingZones.level, level)) : and(isNull(shippingZones.parentZoneId), eq(shippingZones.level, level)));
  const target = normalize(name);
  const clash = siblings.some((zone) => zone.id !== excludeId && normalize(zone.name) === target);
  if (clash) throw new Error(`Ya existe una zona llamada "${name}" en este mismo nivel.`);
}

export async function createZoneAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "create");
    const level = z.enum(CREATABLE_LEVELS).parse(formData.get("level"));
    const parentZoneId = String(formData.get("parentZoneId") ?? "").trim() || null;
    const name = z.string().trim().min(2, "Ponle un nombre a la zona.").max(80).parse(formData.get("name"));

    if (level === "department" && parentZoneId) throw new Error("Un departamento no puede tener una zona padre.");
    if (level !== "department" && !parentZoneId) throw new Error("Falta la zona padre.");

    const db = await getRuntimeDb();
    let parent: Awaited<ReturnType<typeof loadZone>> | null = null;
    if (parentZoneId) {
      parent = await loadZone(db, parentZoneId);
      const expectedChildLevel = CHILD_LEVEL[parent.level as "department" | "city"];
      if (!expectedChildLevel || expectedChildLevel !== level) {
        throw new Error(`Una zona de nivel "${ZONE_LEVEL_LABELS[parent.level as keyof typeof ZONE_LEVEL_LABELS]}" no puede tener hijas de nivel "${ZONE_LEVEL_LABELS[level]}".`);
      }
    }

    await assertUniqueSiblingName(db, level, parentZoneId, name);

    const [created] = await db.insert(shippingZones).values({ name, level, parentZoneId, country: "CO", status: "active" }).returning();
    await db.insert(auditLogs).values({ userId: session.user.id, action: "shippingZone.create", entityType: "shippingZone", entityId: created.id, after: created });
    refresh();
    return { status: "success", message: `${ZONE_LEVEL_LABELS[level]} "${name}" creada.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function createZonesBulkAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "create");
    const level = z.enum(CREATABLE_LEVELS).parse(formData.get("level"));
    const parentZoneId = String(formData.get("parentZoneId") ?? "").trim() || null;
    if (level === "department" && parentZoneId) throw new Error("Un departamento no puede tener una zona padre.");
    if (level !== "department" && !parentZoneId) throw new Error("Falta la zona padre.");

    const namesRaw = z.string().min(1, "Escribe al menos un nombre.").parse(formData.get("names"));
    const names = [...new Set(namesRaw.split(/[,\n]/).map((n) => n.trim()).filter(Boolean))];
    if (names.length === 0) throw new Error("Escribe al menos un nombre.");

    const db = await getRuntimeDb();
    if (parentZoneId) {
      const parent = await loadZone(db, parentZoneId);
      const expectedChildLevel = CHILD_LEVEL[parent.level as "department" | "city"];
      if (!expectedChildLevel || expectedChildLevel !== level) {
        throw new Error(`Una zona de nivel "${ZONE_LEVEL_LABELS[parent.level as keyof typeof ZONE_LEVEL_LABELS]}" no puede tener hijas de nivel "${ZONE_LEVEL_LABELS[level]}".`);
      }
    }

    const existing = await db
      .select()
      .from(shippingZones)
      .where(parentZoneId ? and(eq(shippingZones.parentZoneId, parentZoneId), eq(shippingZones.level, level)) : and(isNull(shippingZones.parentZoneId), eq(shippingZones.level, level)));
    const existingNames = new Set(existing.map((zone) => normalize(zone.name)));
    const toCreate = names.filter((name) => !existingNames.has(normalize(name)));

    if (toCreate.length > 0) {
      await db.insert(shippingZones).values(
        toCreate.map((name) => ({ name, level, parentZoneId, country: "CO", status: "active" as const })),
      );
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "shippingZone.bulkCreate",
      entityType: "shippingZone",
      entityId: parentZoneId ?? "root",
      after: { level, created: toCreate, skipped: names.length - toCreate.length },
    });
    refresh();
    const skipped = names.length - toCreate.length;
    const levelLabel = ZONE_LEVEL_LABELS[level];
    return {
      status: "success",
      message: skipped > 0 ? `${toCreate.length} ${levelLabel.toLowerCase()}(s) creado(s); ${skipped} ya existían y se omitieron.` : `${toCreate.length} ${levelLabel.toLowerCase()}(s) creado(s).`,
    };
  } catch (error) {
    return actionError(error);
  }
}

function customNumber(formData: FormData, key: string, mode: string, options: { min?: number; max?: number; integer?: boolean } = {}) {
  if (mode !== "custom") return null;
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) throw new Error(`Completa "${key}" o vuelve a "Heredado".`);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`El campo "${key}" no es un número válido.`);
  if (options.integer && !Number.isInteger(value)) throw new Error(`El campo "${key}" debe ser un número entero.`);
  if (options.min !== undefined && value < options.min) throw new Error(`El campo "${key}" no puede ser menor que ${options.min}.`);
  if (options.max !== undefined && value > options.max) throw new Error(`El campo "${key}" no puede ser mayor que ${options.max}.`);
  return value;
}

function customBool(formData: FormData, key: string, mode: string) {
  if (mode !== "custom") return null;
  return formData.get(key) === "on";
}

function customText(formData: FormData, key: string, mode: string) {
  if (mode !== "custom") return null;
  return String(formData.get(key) ?? "").trim();
}

const PAYMENT_METHODS = ["mercado_pago", "cash_on_delivery", "shipping_advance_transfer", "transfer_full"] as const;

export async function updateZoneConfigAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "update");
    const zoneId = z.string().min(1).parse(formData.get("zoneId"));
    const db = await getRuntimeDb();
    const zone = await loadZone(db, zoneId);

    const name = z.string().trim().min(2, "Ponle un nombre a la zona.").max(80).parse(formData.get("name"));
    const status = z.enum(["active", "inactive"]).parse(formData.get("status"));
    if (name !== zone.name) {
      await assertUniqueSiblingName(db, zone.level, zone.parentZoneId, name, zone.id);
    }

    const mode = (key: string) => String(formData.get(`${key}_mode`) ?? "inherit");

    const fee = customNumber(formData, "fee", mode("fee"), { min: 0, integer: true });
    const freeShippingThreshold = customNumber(formData, "freeShippingThreshold", mode("freeShippingThreshold"), { min: 0, integer: true });
    const coverageMode = mode("coverage");
    const coverage = coverageMode === "custom" ? z.enum(["available", "unavailable"]).parse(formData.get("coverage")) : null;
    const cashOnDeliveryAllowed = customBool(formData, "cashOnDeliveryAllowed", mode("cashOnDeliveryAllowed"));
    const requiresAdvancePayment = customBool(formData, "requiresAdvancePayment", mode("requiresAdvancePayment"));
    const advancePercentage = customNumber(formData, "advancePercentage", mode("advancePercentage"), { min: 1, max: 100, integer: true });
    if (requiresAdvancePayment === true && mode("advancePercentage") === "custom" && advancePercentage === null) {
      throw new Error("Define un porcentaje de anticipo entre 1 y 100.");
    }
    const sameDayAvailable = customBool(formData, "sameDayAvailable", mode("sameDayAvailable"));
    const sameDayCutoffHour = customNumber(formData, "sameDayCutoffHour", mode("sameDayCutoffHour"), { min: 0, max: 23, integer: true });
    const estimatedBusinessDaysMin = customNumber(formData, "estimatedBusinessDaysMin", mode("estimatedBusinessDaysMin"), { min: 0, integer: true });
    const estimatedBusinessDaysMax = customNumber(formData, "estimatedBusinessDaysMax", mode("estimatedBusinessDaysMax"), { min: 0, integer: true });
    if (estimatedBusinessDaysMin !== null && estimatedBusinessDaysMax !== null && estimatedBusinessDaysMax < estimatedBusinessDaysMin) {
      throw new Error("El plazo máximo no puede ser menor que el mínimo.");
    }
    const allowedPaymentMethodsMode = mode("allowedPaymentMethods");
    const allowedPaymentMethods =
      allowedPaymentMethodsMode === "custom"
        ? z.array(z.enum(PAYMENT_METHODS)).min(1, "Selecciona al menos un método de pago.").parse(formData.getAll("allowedPaymentMethods"))
        : null;
    const customerMessageMode = mode("customerMessage");
    const customerMessage = customerMessageMode === "custom" ? customText(formData, "customerMessage", customerMessageMode) : null;

    const now = new Date();
    await db.update(shippingZones).set({ name, status, updatedAt: now }).where(eq(shippingZones.id, zoneId));

    const [existingRule] = await db.select().from(shippingRules).where(eq(shippingRules.zoneId, zoneId)).limit(1);
    const ruleValues = {
      fee,
      freeShippingThreshold,
      coverage,
      cashOnDeliveryAllowed,
      requiresAdvancePayment,
      advancePercentage,
      sameDayAvailable,
      sameDayCutoffHour,
      estimatedBusinessDaysMin,
      estimatedBusinessDaysMax,
      allowedPaymentMethods,
      customerMessage,
      updatedAt: now,
    };
    if (existingRule) {
      await db.update(shippingRules).set(ruleValues).where(eq(shippingRules.id, existingRule.id));
    } else {
      await db.insert(shippingRules).values({ zoneId, ...ruleValues });
    }

    await db.insert(auditLogs).values({ userId: session.user.id, action: "shippingZone.updateConfig", entityType: "shippingZone", entityId: zoneId, after: { name, status, ...ruleValues } });
    refresh();
    return { status: "success", message: `"${name}" guardada.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteZoneAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "delete");
    const zoneId = z.string().min(1).parse(formData.get("zoneId"));
    const db = await getRuntimeDb();
    const zone = await loadZone(db, zoneId);
    if (zone.level === "country") throw new Error("La zona de respaldo nacional no se puede eliminar.");

    await db.delete(shippingZones).where(eq(shippingZones.id, zoneId));
    await db.insert(auditLogs).values({ userId: session.user.id, action: "shippingZone.delete", entityType: "shippingZone", entityId: zoneId, before: zone });
    refresh();
    return { status: "success", message: `"${zone.name}" eliminada junto con sus zonas hijas.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteZonesBulkAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "delete");
    const zoneIds = z.array(z.string().min(1)).min(1).parse(formData.getAll("zoneId"));
    const db = await getRuntimeDb();
    const names: string[] = [];
    for (const zoneId of zoneIds) {
      const zone = await loadZone(db, zoneId);
      if (zone.level === "country") throw new Error("La zona de respaldo nacional no se puede eliminar.");
      await db.delete(shippingZones).where(eq(shippingZones.id, zoneId));
      await db.insert(auditLogs).values({ userId: session.user.id, action: "shippingZone.delete", entityType: "shippingZone", entityId: zoneId, before: zone });
      names.push(zone.name);
    }
    refresh();
    return { status: "success", message: `${names.length} zona(s) eliminada(s) junto con sus zonas hijas.` };
  } catch (error) {
    return actionError(error);
  }
}

export type BulkZoneConfigRow = {
  zoneId: string;
  fee?: number;
  coverage?: "available" | "unavailable";
  estimatedBusinessDaysMin?: number;
  estimatedBusinessDaysMax?: number;
};

const bulkZoneConfigRowSchema = z.object({
  zoneId: z.string().min(1),
  fee: z.number().int().min(0).optional(),
  coverage: z.enum(["available", "unavailable"]).optional(),
  estimatedBusinessDaysMin: z.number().int().min(0).optional(),
  estimatedBusinessDaysMax: z.number().int().min(0).optional(),
});

// Edición rápida masiva: a diferencia de `updateZoneConfigAction`, aquí cada
// campo ausente en una fila significa "no tocar" (no "volver a heredado") —
// solo se escriben en `shipping_rules` los campos que la fila trae.
export async function bulkUpdateZoneConfigAction(input: BulkZoneConfigRow[]): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "update");
    const rows = z.array(bulkZoneConfigRowSchema).min(1).parse(input);
    const db = await getRuntimeDb();
    const now = new Date();
    let updated = 0;

    for (const row of rows) {
      const zone = await loadZone(db, row.zoneId);
      if (row.estimatedBusinessDaysMin !== undefined && row.estimatedBusinessDaysMax !== undefined && row.estimatedBusinessDaysMax < row.estimatedBusinessDaysMin) {
        throw new Error(`"${zone.name}": el plazo máximo no puede ser menor que el mínimo.`);
      }
      const patch: Partial<typeof shippingRules.$inferInsert> = { updatedAt: now };
      if (row.fee !== undefined) patch.fee = row.fee;
      if (row.coverage !== undefined) patch.coverage = row.coverage;
      if (row.estimatedBusinessDaysMin !== undefined) patch.estimatedBusinessDaysMin = row.estimatedBusinessDaysMin;
      if (row.estimatedBusinessDaysMax !== undefined) patch.estimatedBusinessDaysMax = row.estimatedBusinessDaysMax;
      if (Object.keys(patch).length === 1) continue;

      const [existingRule] = await db.select().from(shippingRules).where(eq(shippingRules.zoneId, row.zoneId)).limit(1);
      if (existingRule) {
        await db.update(shippingRules).set(patch).where(eq(shippingRules.id, existingRule.id));
      } else {
        await db.insert(shippingRules).values({ zoneId: row.zoneId, ...patch });
      }
      updated++;
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "shippingZone.bulkUpdateConfig",
      entityType: "shippingZone",
      entityId: rows[0].zoneId,
      after: { count: updated, rows },
    });
    refresh();
    return { status: "success", message: `${updated} zona(s) actualizada(s).` };
  } catch (error) {
    return actionError(error);
  }
}

export type ZoneSearchResult = {
  id: string;
  name: string;
  level: "country" | "department" | "city" | "neighborhood";
  path: string;
  href: string;
};

export async function searchZonesAction(query: string): Promise<ZoneSearchResult[]> {
  await requirePermission("shipping", "read");
  const q = normalize(query);
  if (!q) return [];
  const db = await getRuntimeDb();
  const zones = await db.select().from(shippingZones);
  const byId = new Map(zones.map((zone) => [zone.id, zone]));

  function pathFor(zone: (typeof zones)[number]) {
    const chain: string[] = [];
    let cursor: (typeof zones)[number] | undefined = zone;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      chain.unshift(cursor.name);
      cursor = cursor.parentZoneId ? byId.get(cursor.parentZoneId) : undefined;
    }
    return chain.join(" › ");
  }

  function hrefFor(zone: (typeof zones)[number]) {
    if (zone.level === "department") return `/admin/envios/${zone.id}`;
    if (zone.level === "city") return `/admin/envios/${zone.parentZoneId}/${zone.id}`;
    if (zone.level === "neighborhood") {
      const city = zone.parentZoneId ? byId.get(zone.parentZoneId) : undefined;
      if (city?.parentZoneId) return `/admin/envios/${city.parentZoneId}/${city.id}`;
    }
    return "/admin/envios";
  }

  return zones
    .filter((zone) => normalize(zone.name).includes(q))
    .slice(0, 20)
    .map((zone) => ({ id: zone.id, name: zone.name, level: zone.level, path: pathFor(zone), href: hrefFor(zone) }));
}
