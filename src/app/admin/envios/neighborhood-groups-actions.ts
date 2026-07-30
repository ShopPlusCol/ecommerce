"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, shippingRules, shippingZones } from "@/infrastructure/db/schema";
import { normalize } from "@/domain/services/shipping";
import { revalidatePath } from "next/cache";
import { RESERVED_GROUP_LABELS } from "./neighborhood-groups-constants";

type Db = Awaited<ReturnType<typeof getRuntimeDb>>;

function refresh() {
  revalidatePath("/admin/envios");
}

async function findGroup(db: Db, city: string, groupKey: string) {
  if (groupKey === "unassigned" || groupKey === "no_coverage") {
    const rows = await db
      .select()
      .from(shippingZones)
      .where(and(eq(shippingZones.level, "neighborhood"), eq(shippingZones.groupKind, groupKey)));
    const match = rows.find((row) => normalize(row.city) === normalize(city));
    return match ?? createReservedGroup(db, city, groupKey);
  }
  const [row] = await db.select().from(shippingZones).where(eq(shippingZones.id, groupKey)).limit(1);
  if (!row) throw new Error("El grupo ya no existe.");
  return row;
}

async function createReservedGroup(db: Db, city: string, kind: "unassigned" | "no_coverage") {
  const [created] = await db
    .insert(shippingZones)
    .values({
      name: RESERVED_GROUP_LABELS[kind],
      level: "neighborhood",
      city,
      department: null,
      groupKind: kind,
      neighborhoodNames: [],
      status: "active",
    })
    .returning();
  if (kind === "no_coverage") {
    await db.insert(shippingRules).values({
      zoneId: created.id,
      name: "Sin cobertura",
      fee: 0,
      blocksDelivery: true,
      status: "active",
      customerMessage: "Todavía no hacemos envíos a este barrio. Escríbenos por WhatsApp para revisar opciones.",
    });
  }
  return created;
}

/** Quita `name` (comparado sin tildes/mayúsculas) de cualquier grupo de barrios de esa ciudad. */
async function removeFromAllGroups(db: Db, city: string, name: string) {
  const groups = await db.select().from(shippingZones).where(eq(shippingZones.level, "neighborhood"));
  const target = normalize(name);
  for (const group of groups) {
    if (normalize(group.city) !== normalize(city)) continue;
    const names = group.neighborhoodNames ?? [];
    if (!names.some((n) => normalize(n) === target)) continue;
    await db
      .update(shippingZones)
      .set({ neighborhoodNames: names.filter((n) => normalize(n) !== target), updatedAt: new Date() })
      .where(eq(shippingZones.id, group.id));
  }
}

async function addNamesToGroup(db: Db, city: string, groupKey: string, rawNames: string[]) {
  const names = [...new Set(rawNames.map((n) => n.trim()).filter(Boolean))];
  if (names.length === 0) return;
  const group = await findGroup(db, city, groupKey);
  for (const name of names) {
    await removeFromAllGroups(db, city, name);
  }
  const [current] = await db.select().from(shippingZones).where(eq(shippingZones.id, group.id)).limit(1);
  const existingNames = current?.neighborhoodNames ?? [];
  const merged = [...existingNames];
  for (const name of names) {
    if (!merged.some((n) => normalize(n) === normalize(name))) merged.push(name);
  }
  await db.update(shippingZones).set({ neighborhoodNames: merged, updatedAt: new Date() }).where(eq(shippingZones.id, group.id));
}

export async function moveNeighborhoodAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "update");
    const city = z.string().min(1).parse(formData.get("city"));
    const name = z.string().min(1).parse(formData.get("name"));
    const targetGroupKey = z.string().min(1).parse(formData.get("targetGroupKey"));
    const db = await getRuntimeDb();
    await addNamesToGroup(db, city, targetGroupKey, [name]);
    await db.insert(auditLogs).values({ userId: session.user.id, action: "shippingZone.neighborhood.move", entityType: "shippingZone", entityId: targetGroupKey, after: { city, name, targetGroupKey } });
    refresh();
    return { status: "success", message: "Barrio movido." };
  } catch (error) {
    return actionError(error);
  }
}

export async function addNeighborhoodsAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "update");
    const city = z.string().min(1).parse(formData.get("city"));
    const targetGroupKey = z.string().min(1).parse(formData.get("targetGroupKey"));
    const namesCsv = z.string().min(1, "Escribe al menos un barrio.").parse(formData.get("namesCsv"));
    const names = namesCsv.split(",").map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) throw new Error("Escribe al menos un barrio.");
    const db = await getRuntimeDb();
    await addNamesToGroup(db, city, targetGroupKey, names);
    await db.insert(auditLogs).values({ userId: session.user.id, action: "shippingZone.neighborhood.add", entityType: "shippingZone", entityId: targetGroupKey, after: { city, names } });
    refresh();
    return { status: "success", message: `${names.length} barrio(s) agregado(s).` };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeNeighborhoodAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "update");
    const city = z.string().min(1).parse(formData.get("city"));
    const name = z.string().min(1).parse(formData.get("name"));
    const db = await getRuntimeDb();
    await removeFromAllGroups(db, city, name);
    await db.insert(auditLogs).values({ userId: session.user.id, action: "shippingZone.neighborhood.remove", entityType: "shippingZone", entityId: city, after: { city, name } });
    refresh();
    return { status: "success", message: "Barrio eliminado." };
  } catch (error) {
    return actionError(error);
  }
}

export async function createNeighborhoodGroupAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "create");
    const city = z.string().min(1).parse(formData.get("city"));
    const name = z.string().trim().min(2, "Ponle un nombre al grupo.").max(80).parse(formData.get("name"));
    if (name === RESERVED_GROUP_LABELS.unassigned || name === RESERVED_GROUP_LABELS.no_coverage) {
      throw new Error("Ese nombre está reservado. Elige otro.");
    }
    const db = await getRuntimeDb();
    const [created] = await db
      .insert(shippingZones)
      .values({ name, level: "neighborhood", city, department: null, groupKind: "custom", neighborhoodNames: [], status: "active" })
      .returning();
    await db.insert(auditLogs).values({ userId: session.user.id, action: "shippingZone.group.create", entityType: "shippingZone", entityId: created.id, after: { city, name } });
    refresh();
    return { status: "success", message: `Grupo “${name}” creado.` };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteNeighborhoodGroupAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "delete");
    const groupId = z.string().min(1).parse(formData.get("groupId"));
    const db = await getRuntimeDb();
    const [group] = await db.select().from(shippingZones).where(eq(shippingZones.id, groupId)).limit(1);
    if (!group) throw new Error("El grupo ya no existe.");
    if (group.groupKind !== "custom") throw new Error("Los grupos reservados no se pueden eliminar.");
    const names = group.neighborhoodNames ?? [];
    if (names.length > 0 && group.city) {
      await addNamesToGroup(db, group.city, "unassigned", names);
    }
    await db.delete(shippingZones).where(eq(shippingZones.id, groupId));
    await db.insert(auditLogs).values({ userId: session.user.id, action: "shippingZone.group.delete", entityType: "shippingZone", entityId: groupId, before: { name: group.name, neighborhoodNames: names } });
    refresh();
    return { status: "success", message: "Grupo eliminado; sus barrios pasaron a “Sin grupo”." };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveNeighborhoodGroupPriceAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const session = await requirePermission("shipping", "update");
    const city = z.string().min(1).parse(formData.get("city"));
    const groupKey = z.string().min(1).parse(formData.get("groupKey"));
    const db = await getRuntimeDb();
    // findGroup crea el grupo reservado ("no_coverage") si todavía no existía
    // en la base (p. ej. es la primera vez que se guarda su mensaje).
    const group = await findGroup(db, city, groupKey);
    const groupId = group.id;
    if (group.groupKind === "unassigned") throw new Error("“Sin grupo” no tiene tarifa propia: usa la tarifa de la ciudad.");

    const customerMessage = z.string().trim().max(300).parse(formData.get("customerMessage") ?? "") || null;
    const status = z.enum(["draft", "active", "inactive"]).parse(formData.get("status"));

    if (group.groupKind === "custom") {
      const name = z.string().trim().min(2, "Ponle un nombre al grupo.").max(80).parse(formData.get("name"));
      if (name === RESERVED_GROUP_LABELS.unassigned || name === RESERVED_GROUP_LABELS.no_coverage) {
        throw new Error("Ese nombre está reservado. Elige otro.");
      }
      await db.update(shippingZones).set({ name, updatedAt: new Date() }).where(eq(shippingZones.id, groupId));
    }

    const [existingRule] = await db.select().from(shippingRules).where(eq(shippingRules.zoneId, groupId)).limit(1);

    if (group.groupKind === "no_coverage") {
      if (existingRule) {
        await db.update(shippingRules).set({ customerMessage, status, updatedAt: new Date() }).where(eq(shippingRules.id, existingRule.id));
      } else {
        await db.insert(shippingRules).values({ zoneId: groupId, name: "Sin cobertura", fee: 0, blocksDelivery: true, status, customerMessage });
      }
      refresh();
      return { status: "success", message: "Mensaje de sin cobertura guardado." };
    }

    const fee = z.coerce.number().int().min(0).parse(formData.get("fee") ?? 0);
    const freeShippingThresholdRaw = String(formData.get("freeShippingThreshold") ?? "").trim();
    const freeShippingThreshold = freeShippingThresholdRaw ? z.coerce.number().int().min(0).parse(freeShippingThresholdRaw) : null;
    const cashOnDeliveryAllowed = formData.get("cashOnDeliveryAllowed") === "on";
    const requiresAdvancePayment = formData.get("requiresAdvancePayment") === "on";
    const advancePercentageRaw = String(formData.get("advancePercentage") ?? "").trim();
    const advancePercentage = advancePercentageRaw ? z.coerce.number().int().min(1).max(100).parse(advancePercentageRaw) : null;
    const sameDayAvailable = formData.get("sameDayAvailable") === "on";
    const sameDayCutoffHourRaw = String(formData.get("sameDayCutoffHour") ?? "").trim();
    const sameDayCutoffHour = sameDayCutoffHourRaw ? z.coerce.number().int().min(0).max(23).parse(sameDayCutoffHourRaw) : null;
    const estimatedBusinessDaysMin = z.coerce.number().int().min(0).parse(formData.get("estimatedBusinessDaysMin") ?? 0);
    const estimatedBusinessDaysMax = z.coerce.number().int().min(0).parse(formData.get("estimatedBusinessDaysMax") ?? 1);
    if (estimatedBusinessDaysMax < estimatedBusinessDaysMin) throw new Error("El plazo máximo no puede ser menor que el mínimo.");
    if (requiresAdvancePayment && !advancePercentage) throw new Error("Define un porcentaje de anticipo entre 1 y 100.");

    const values = {
      zoneId: groupId,
      name: `Grupo ${group.name}`,
      fee,
      freeShippingThreshold,
      cashOnDeliveryAllowed,
      requiresAdvancePayment,
      advancePercentage,
      sameDayAvailable,
      sameDayCutoffHour,
      estimatedBusinessDaysMin,
      estimatedBusinessDaysMax,
      blocksDelivery: false,
      customerMessage,
      status,
      updatedAt: new Date(),
    };
    if (existingRule) {
      await db.update(shippingRules).set(values).where(eq(shippingRules.id, existingRule.id));
    } else {
      await db.insert(shippingRules).values(values);
    }
    await db.insert(auditLogs).values({ userId: session.user.id, action: "shippingZone.group.price", entityType: "shippingZone", entityId: groupId, after: values });
    refresh();
    return { status: "success", message: "Tarifa del grupo guardada." };
  } catch (error) {
    return actionError(error);
  }
}
