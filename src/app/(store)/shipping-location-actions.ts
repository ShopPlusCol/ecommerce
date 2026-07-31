"use server";

import { normalize, resolveEffectiveZoneConfig } from "@/domain/services/shipping";
import { loadShippingTree } from "@/infrastructure/shipping/zone-tree-repository";

/**
 * Departamentos, ciudades y barrios que el checkout puede ofrecer,
 * leyendo directamente el árbol configurado en `/admin/envios` (sección
 * 17.3): mismo dato, misma cascada de actividad, que usa `resolveShippingQuote`
 * para calcular la tarifa — así el checkout nunca ofrece una opción que
 * después no cotiza.
 */

async function loadActiveTree() {
  const { zones, rules } = await loadShippingTree();
  const isUsable = (zoneId: string) => resolveEffectiveZoneConfig(zones, rules, zoneId)?.effectivelyActive ?? false;
  return { zones, rules, isUsable };
}

/**
 * Departamentos configurados y activos (nivel raíz del árbol). Los 32
 * departamentos de Colombia + Bogotá D.C. vienen precargados de fábrica
 * (migración `0016`), así que esta lista normalmente los incluye a todos
 * desde el primer arranque; si el admin agrega uno con un nombre distinto
 * a esa lista real, también aparece aquí — nunca queda una zona
 * configurada inalcanzable desde el checkout.
 */
export async function listShippingDepartmentsAction(): Promise<string[]> {
  const { zones, isUsable } = await loadActiveTree();
  return zones
    .filter((zone) => zone.level === "department" && isUsable(zone.id))
    .map((zone) => zone.name)
    .sort((a, b) => a.localeCompare(b, "es-CO"));
}

/** Ciudades/municipios configurados y activos bajo un departamento (vacío = el checkout no pide ciudad, usa la config del departamento). */
export async function listShippingCitiesAction(department: string): Promise<string[]> {
  const { zones, isUsable } = await loadActiveTree();
  const target = normalize(department);
  const dept = zones.find((zone) => zone.level === "department" && normalize(zone.name) === target);
  if (!dept) return [];
  return zones
    .filter((zone) => zone.level === "city" && zone.parentZoneId === dept.id && isUsable(zone.id))
    .map((zone) => zone.name)
    .sort((a, b) => a.localeCompare(b, "es-CO"));
}

/** Barrios configurados y activos bajo una ciudad (vacío = el checkout no pide barrio, usa la config de la ciudad). */
export async function listShippingNeighborhoodsAction(department: string, city: string): Promise<string[]> {
  const { zones, isUsable } = await loadActiveTree();
  const deptTarget = normalize(department);
  const dept = zones.find((zone) => zone.level === "department" && normalize(zone.name) === deptTarget);
  if (!dept) return [];
  const cityTarget = normalize(city);
  const cityZone = zones.find((zone) => zone.level === "city" && zone.parentZoneId === dept.id && normalize(zone.name) === cityTarget);
  if (!cityZone) return [];
  return zones
    .filter((zone) => zone.level === "neighborhood" && zone.parentZoneId === cityZone.id && isUsable(zone.id))
    .map((zone) => zone.name)
    .sort((a, b) => a.localeCompare(b, "es-CO"));
}
