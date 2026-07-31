import { describe, expect, it } from "vitest";
import { localHour, resolveSameDayEligibility } from "@/domain/services/business-time";

describe("localHour", () => {
  it("convierte una hora UTC a la hora local de Bogotá (UTC-5, sin horario de verano)", () => {
    // 18:30 UTC == 13:30 en America/Bogota.
    expect(localHour(new Date("2026-07-30T18:30:00Z"))).toBe(13);
  });

  it("normaliza la medianoche a 0, no a 24", () => {
    // 05:00 UTC == 00:00 en America/Bogota.
    expect(localHour(new Date("2026-07-30T05:00:00Z"))).toBe(0);
  });
});

describe("resolveSameDayEligibility (sección 17.6)", () => {
  it("no aplica si la zona no ofrece entrega el mismo día, sin importar la hora", () => {
    expect(resolveSameDayEligibility(false, 14, new Date("2026-07-30T15:00:00Z"))).toBe(false);
  });

  it("aplica sin restricción de hora si no hay hora límite configurada", () => {
    expect(resolveSameDayEligibility(true, null, new Date("2026-07-30T23:59:00Z"))).toBe(true);
  });

  it("aplica antes de la hora límite", () => {
    // 18:00 UTC == 13:00 Bogotá, antes del límite de 14:00.
    expect(resolveSameDayEligibility(true, 14, new Date("2026-07-30T18:00:00Z"))).toBe(true);
  });

  it("deja de aplicar justo en la hora límite y después de ella", () => {
    // 19:00 UTC == 14:00 Bogotá, exactamente el límite: ya no aplica.
    expect(resolveSameDayEligibility(true, 14, new Date("2026-07-30T19:00:00Z"))).toBe(false);
    // 20:00 UTC == 15:00 Bogotá, después del límite.
    expect(resolveSameDayEligibility(true, 14, new Date("2026-07-30T20:00:00Z"))).toBe(false);
  });
});
