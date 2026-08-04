import { resolveSameDayEligibility } from "@/domain/services/business-time";

/**
 * Configuración de entrega el mismo día de una ciudad concreta, ya resuelta
 * contra el árbol de zonas (zona y ancestros activos, con cobertura).
 */
export type SameDayZoneConfig = {
  cityName: string;
  sameDayAvailable: boolean;
  cutoffHour: number | null;
};

/**
 * Promesa de entrega el mismo día que la tienda puede mostrar *en este
 * momento*, sin conocer todavía la dirección del visitante.
 *
 * Regla de negocio (sección 2 del encargo): la promesa nunca se muestra de
 * forma global ni incondicional. Solo es `available` si al menos una ciudad
 * tiene la entrega el mismo día realmente configurada y la hora local actual
 * sigue antes de su hora límite. Pasada la hora límite de todas las ciudades,
 * la tienda deja de prometer "hoy" — no muestra un texto que ya no puede
 * cumplir.
 *
 * `cities` alimenta el texto ("Medellín, Bello") para que la promesa quede
 * acotada a donde de verdad aplica, y `disclaimerNeeded` marca que el texto
 * debe ir acompañado de la aclaración de zona/disponibilidad.
 */
export type SameDayPromise = {
  available: boolean;
  cities: string[];
  /** Hora límite más temprana entre las ciudades elegibles (para el aviso). */
  earliestCutoffHour: number | null;
  disclaimerNeeded: boolean;
};

export function resolveSameDayPromise(
  zones: readonly SameDayZoneConfig[],
  now: Date,
  timeZone?: string,
): SameDayPromise {
  const eligible = zones.filter((zone) =>
    resolveSameDayEligibility(zone.sameDayAvailable, zone.cutoffHour, now, timeZone),
  );

  if (eligible.length === 0) {
    return { available: false, cities: [], earliestCutoffHour: null, disclaimerNeeded: false };
  }

  const cities = [...new Set(eligible.map((zone) => zone.cityName.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "es"),
  );

  const cutoffs = eligible
    .map((zone) => zone.cutoffHour)
    .filter((hour): hour is number => hour !== null);

  return {
    available: true,
    cities,
    earliestCutoffHour: cutoffs.length ? Math.min(...cutoffs) : null,
    // Siempre: incluso con ciudades elegibles la entrega depende de
    // disponibilidad y del día de operación, que aquí no se conocen.
    disclaimerNeeded: true,
  };
}

/**
 * Texto corto de la promesa, ya acotado a las ciudades reales. Devuelve
 * `null` cuando no hay nada honesto que prometer, para que quien lo llame
 * simplemente no renderice la línea (en vez de mostrar un texto vacío o un
 * "consulta disponibilidad" que no aporta).
 */
export function sameDayPromiseLabel(promise: SameDayPromise): string | null {
  if (!promise.available || promise.cities.length === 0) return null;
  const cities =
    promise.cities.length === 1
      ? promise.cities[0]
      : `${promise.cities.slice(0, -1).join(", ")} y ${promise.cities.at(-1)}`;
  return `Entrega el mismo día en ${cities}`;
}
