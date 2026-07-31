export type BarrioGroupKind = "coverage" | "no_coverage" | "special_price";

export const BARRIO_GROUP_LABELS: Record<BarrioGroupKind, string> = {
  coverage: "Con cobertura",
  no_coverage: "Sin cobertura",
  special_price: "Precio especial",
};

export const BARRIO_GROUPS: BarrioGroupKind[] = ["coverage", "no_coverage", "special_price"];

/**
 * A qué grupo pertenece hoy un barrio, a partir de su propia fila
 * `shipping_rules` (sección 2 de la Ronda 4: sin columna nueva en
 * `shipping_zones`/`shipping_rules`, se deriva de `coverage` y `fee`).
 * Función pura y compartida: la usan tanto el panel (para pintar las
 * pastillas) como las acciones del servidor (para saber a quién aplicar
 * en bloque la configuración de un grupo) — un archivo `"use server"` solo
 * puede exportar funciones async, así que esta lógica vive aparte.
 */
export function memberGroupFromRule(rule: { coverage: string | null; fee: number | null } | undefined | null): BarrioGroupKind {
  if (!rule) return "coverage";
  if (rule.coverage === "unavailable") return "no_coverage";
  if (rule.fee !== null) return "special_price";
  return "coverage";
}
