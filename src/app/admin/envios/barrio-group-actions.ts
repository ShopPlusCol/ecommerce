"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, shippingNeighborhoodGroupSettings, shippingRules, shippingZones } from "@/infrastructure/db/schema";
import { BARRIO_GROUP_LABELS, memberGroupFromRule } from "./barrio-group-derivation";

type Db = Awaited<ReturnType<typeof getRuntimeDb>>;

const PAYMENT_METHODS = ["mercado_pago", "cash_on_delivery", "shipping_advance_transfer", "transfer_full"] as const;

function refresh() {
  revalidatePath("/admin/envios");
}

async function loadBarrio(db: Db, zoneId: string) {
  const [zone] = await db.select().from(shippingZones).where(eq(shippingZones.id, zoneId)).limit(1);
  if (!zone) throw new Error("El barrio ya no existe.");
  if (zone.level !== "neighborhood") throw new Error("Solo los barrios pertenecen a un grupo.");
  if (!zone.parentZoneId) throw new Error("El barrio no tiene una ciudad asociada.");
  return zone;
}

async function loadCity(db: Db, zoneId: string) {
  const [zone] = await db.select().from(shippingZones).where(eq(shippingZones.id, zoneId)).limit(1);
  if (!zone) throw new Error("La ciudad ya no existe.");
  if (zone.level !== "city") throw new Error("Solo una ciudad/municipio tiene grupos de barrios.");
  return zone;
}

function optionalInt(formData: FormData, key: string, options: { min?: number; max?: number } = {}) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value)) throw new Error(`El campo "${key}" debe ser un número entero.`);
  if (options.min !== undefined && value < options.min) throw new Error(`El campo "${key}" no puede ser menor que ${options.min}.`);
  if (options.max !== undefined && value > options.max) throw new Error(`El campo "${key}" no puede ser mayor que ${options.max}.`);
  return value;
}

type TargetGroup = "coverage" | "no_coverage" | "special_price";

// Valores a escribir en la `shipping_rules` propia de un barrio al entrar a
// `targetGroup`, o `null` si el grupo es "coverage" (heredar todo: se borra
// la fila propia en vez de escribir). Compartido entre el movimiento de un
// solo barrio y el movimiento en bloque de varios a la vez.
async function buildRuleValues(db: Db, cityZoneId: string, targetGroup: TargetGroup, now: Date) {
  if (targetGroup === "coverage") return null;
  const [groupSettings] = await db
    .select()
    .from(shippingNeighborhoodGroupSettings)
    .where(and(eq(shippingNeighborhoodGroupSettings.cityZoneId, cityZoneId), eq(shippingNeighborhoodGroupSettings.groupKind, targetGroup)))
    .limit(1);
  if (targetGroup === "special_price" && !groupSettings) {
    throw new Error(`Configura primero la tarifa del grupo "${BARRIO_GROUP_LABELS.special_price}" antes de mover barrios a él.`);
  }
  return {
    fee: groupSettings?.fee ?? null,
    freeShippingThreshold: groupSettings?.freeShippingThreshold ?? null,
    coverage: targetGroup === "no_coverage" ? ("unavailable" as const) : null,
    cashOnDeliveryAllowed: groupSettings?.cashOnDeliveryAllowed ?? null,
    requiresAdvancePayment: groupSettings?.requiresAdvancePayment ?? null,
    advancePercentage: groupSettings?.advancePercentage ?? null,
    sameDayAvailable: groupSettings?.sameDayAvailable ?? null,
    sameDayCutoffHour: groupSettings?.sameDayCutoffHour ?? null,
    estimatedBusinessDaysMin: groupSettings?.estimatedBusinessDaysMin ?? null,
    estimatedBusinessDaysMax: groupSettings?.estimatedBusinessDaysMax ?? null,
    allowedPaymentMethods: groupSettings?.allowedPaymentMethods ?? null,
    customerMessage: groupSettings?.customerMessage ?? null,
    updatedAt: now,
  };
}

async function applyRuleValues(db: Db, zoneId: string, ruleValues: Awaited<ReturnType<typeof buildRuleValues>>) {
  const [existingRule] = await db.select().from(shippingRules).where(eq(shippingRules.zoneId, zoneId)).limit(1);
  if (ruleValues === null) {
    if (existingRule) await db.delete(shippingRules).where(eq(shippingRules.id, existingRule.id));
    return;
  }
  if (existingRule) {
    await db.update(shippingRules).set(ruleValues).where(eq(shippingRules.id, existingRule.id));
  } else {
    await db.insert(shippingRules).values({ zoneId, ...ruleValues });
  }
}

export async function moveBarrioToGroupAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "update");
    const zoneId = z.string().min(1).parse(formData.get("zoneId"));
    const targetGroup = z.enum(["coverage", "no_coverage", "special_price"]).parse(formData.get("targetGroup"));
    const db = await getRuntimeDb();
    const barrio = await loadBarrio(db, zoneId);
    const now = new Date();

    const ruleValues = await buildRuleValues(db, barrio.parentZoneId!, targetGroup, now);
    await applyRuleValues(db, zoneId, ruleValues);

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "shippingZone.barrioGroup.move",
      entityType: "shippingZone",
      entityId: zoneId,
      after: { targetGroup },
    });
    refresh();
    return { status: "success", message: `"${barrio.name}" movido a "${BARRIO_GROUP_LABELS[targetGroup]}".` };
  } catch (error) {
    return actionError(error);
  }
}

export async function moveBarriosToGroupAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "update");
    const cityZoneId = z.string().min(1).parse(formData.get("cityZoneId"));
    const zoneIds = z.array(z.string().min(1)).min(1).parse(formData.getAll("zoneId"));
    const targetGroup = z.enum(["coverage", "no_coverage", "special_price"]).parse(formData.get("targetGroup"));
    const db = await getRuntimeDb();
    const city = await loadCity(db, cityZoneId);
    const now = new Date();

    const ruleValues = await buildRuleValues(db, cityZoneId, targetGroup, now);
    const names: string[] = [];
    for (const zoneId of zoneIds) {
      const barrio = await loadBarrio(db, zoneId);
      if (barrio.parentZoneId !== cityZoneId) throw new Error(`"${barrio.name}" no pertenece a ${city.name}.`);
      await applyRuleValues(db, zoneId, ruleValues);
      names.push(barrio.name);
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "shippingZone.barrioGroup.moveMany",
      entityType: "shippingZone",
      entityId: cityZoneId,
      after: { targetGroup, zoneIds, count: names.length },
    });
    refresh();
    return { status: "success", message: `${names.length} barrio(s) movido(s) a "${BARRIO_GROUP_LABELS[targetGroup]}".` };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveGroupSettingsAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "update");
    const cityZoneId = z.string().min(1).parse(formData.get("cityZoneId"));
    const groupKind = z.enum(["no_coverage", "special_price"]).parse(formData.get("groupKind"));
    const db = await getRuntimeDb();
    const city = await loadCity(db, cityZoneId);

    const fee = optionalInt(formData, "fee", { min: 0 });
    if (groupKind === "special_price" && fee === null) {
      throw new Error(`Define una tarifa para el grupo "${BARRIO_GROUP_LABELS.special_price}".`);
    }
    const freeShippingThreshold = optionalInt(formData, "freeShippingThreshold", { min: 0 });
    const cashOnDeliveryAllowed = formData.get("cashOnDeliveryAllowed") === "on";
    const requiresAdvancePayment = formData.get("requiresAdvancePayment") === "on";
    const advancePercentage = optionalInt(formData, "advancePercentage", { min: 1, max: 100 });
    if (requiresAdvancePayment && advancePercentage === null) throw new Error("Define un porcentaje de anticipo entre 1 y 100.");
    const sameDayAvailable = formData.get("sameDayAvailable") === "on";
    const sameDayCutoffHour = optionalInt(formData, "sameDayCutoffHour", { min: 0, max: 23 });
    const estimatedBusinessDaysMin = optionalInt(formData, "estimatedBusinessDaysMin", { min: 0 });
    const estimatedBusinessDaysMax = optionalInt(formData, "estimatedBusinessDaysMax", { min: 0 });
    if (estimatedBusinessDaysMin !== null && estimatedBusinessDaysMax !== null && estimatedBusinessDaysMax < estimatedBusinessDaysMin) {
      throw new Error("El plazo máximo no puede ser menor que el mínimo.");
    }
    const allowedPaymentMethodsRaw = z.array(z.enum(PAYMENT_METHODS)).parse(formData.getAll("allowedPaymentMethods"));
    if (groupKind === "special_price" && allowedPaymentMethodsRaw.length === 0) {
      throw new Error("Selecciona al menos un método de pago.");
    }
    if (cashOnDeliveryAllowed && !allowedPaymentMethodsRaw.includes("cash_on_delivery")) {
      throw new Error("Si permites contraentrega, inclúyela entre los métodos permitidos.");
    }
    const allowedPaymentMethods = allowedPaymentMethodsRaw.length ? allowedPaymentMethodsRaw : null;
    const customerMessage = String(formData.get("customerMessage") ?? "").trim() || null;

    const now = new Date();
    const sharedValues = {
      fee,
      freeShippingThreshold,
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

    const [existingGroup] = await db
      .select()
      .from(shippingNeighborhoodGroupSettings)
      .where(and(eq(shippingNeighborhoodGroupSettings.cityZoneId, cityZoneId), eq(shippingNeighborhoodGroupSettings.groupKind, groupKind)))
      .limit(1);
    if (existingGroup) {
      await db.update(shippingNeighborhoodGroupSettings).set(sharedValues).where(eq(shippingNeighborhoodGroupSettings.id, existingGroup.id));
    } else {
      await db.insert(shippingNeighborhoodGroupSettings).values({ cityZoneId, groupKind, ...sharedValues });
    }

    // Aplica de inmediato a todos los barrios que hoy pertenecen a este grupo.
    const barrios = await db.select().from(shippingZones).where(and(eq(shippingZones.parentZoneId, cityZoneId), eq(shippingZones.level, "neighborhood")));
    const existingRules = barrios.length
      ? await db.select().from(shippingRules).where(inArray(shippingRules.zoneId, barrios.map((b) => b.id)))
      : [];
    const rulesByZoneId = new Map(existingRules.map((r) => [r.zoneId, r]));
    const members = barrios.filter((barrio) => memberGroupFromRule(rulesByZoneId.get(barrio.id)) === groupKind);

    const ruleValues = { ...sharedValues, coverage: groupKind === "no_coverage" ? ("unavailable" as const) : null };
    for (const barrio of members) {
      const existingRule = rulesByZoneId.get(barrio.id);
      if (existingRule) {
        await db.update(shippingRules).set(ruleValues).where(eq(shippingRules.id, existingRule.id));
      } else {
        await db.insert(shippingRules).values({ zoneId: barrio.id, ...ruleValues });
      }
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "shippingZone.barrioGroup.saveSettings",
      entityType: "shippingZone",
      entityId: cityZoneId,
      after: { groupKind, ...sharedValues, appliedTo: members.length },
    });
    refresh();
    return {
      status: "success",
      message: `Configuración de "${BARRIO_GROUP_LABELS[groupKind]}" guardada${members.length > 0 ? ` y aplicada a ${members.length} barrio(s)` : ""} en ${city.name}.`,
    };
  } catch (error) {
    return actionError(error);
  }
}
