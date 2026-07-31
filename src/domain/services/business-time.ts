const DEFAULT_TIME_ZONE = "America/Bogota";

/**
 * Hora local (0-23) de `now` en `timeZone`. Pura y con `now` inyectable
 * para poder probarla sin depender del reloj real (sección 17.6).
 */
export function localHour(now: Date, timeZone: string = DEFAULT_TIME_ZONE): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    hour: "numeric",
  }).format(now);
  return Number(formatted);
}

/**
 * Decide si la entrega el mismo día todavía aplica a la hora actual.
 * `cutoffHour` es la hora local (0-23) límite para pedir con entrega el
 * mismo día; `null` significa sin hora límite (siempre aplica mientras
 * `sameDayAvailable` sea verdadero). Después de la hora límite, el
 * checkout debe usar los días hábiles estimados en su lugar, no mostrar
 * "mismo día" (sección 17.6).
 */
export function resolveSameDayEligibility(
  sameDayAvailable: boolean,
  cutoffHour: number | null,
  now: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): boolean {
  if (!sameDayAvailable) return false;
  if (cutoffHour === null) return true;
  return localHour(now, timeZone) < cutoffHour;
}
