import { describe, expect, it } from "vitest";
import { resolveSameDayPromise, sameDayPromiseLabel } from "@/domain/services/store-promise";

/** 2026-08-04 15:00 UTC = 10:00 en America/Bogota (UTC-5). */
const TEN_AM_BOGOTA = new Date("2026-08-04T15:00:00Z");
/** 2026-08-04 20:00 UTC = 15:00 en America/Bogota. */
const THREE_PM_BOGOTA = new Date("2026-08-04T20:00:00Z");

describe("promesa de entrega el mismo día", () => {
  it("no promete nada cuando ninguna ciudad tiene mismo día configurado", () => {
    const promise = resolveSameDayPromise(
      [{ cityName: "Medellín", sameDayAvailable: false, cutoffHour: 14 }],
      TEN_AM_BOGOTA,
    );
    expect(promise.available).toBe(false);
    expect(sameDayPromiseLabel(promise)).toBeNull();
  });

  it("promete solo en las ciudades elegibles, no de forma global", () => {
    const promise = resolveSameDayPromise(
      [
        { cityName: "Medellín", sameDayAvailable: true, cutoffHour: 14 },
        { cityName: "Bogotá", sameDayAvailable: false, cutoffHour: null },
      ],
      TEN_AM_BOGOTA,
    );
    expect(promise.cities).toEqual(["Medellín"]);
    expect(sameDayPromiseLabel(promise)).toBe("Entrega el mismo día en Medellín");
  });

  it("deja de prometer una vez pasada la hora límite", () => {
    const zones = [{ cityName: "Medellín", sameDayAvailable: true, cutoffHour: 14 }];
    expect(resolveSameDayPromise(zones, TEN_AM_BOGOTA).available).toBe(true);
    // 15:00 en Bogotá ya pasó la hora límite de las 14:00.
    const afterCutoff = resolveSameDayPromise(zones, THREE_PM_BOGOTA);
    expect(afterCutoff.available).toBe(false);
    expect(sameDayPromiseLabel(afterCutoff)).toBeNull();
  });

  it("enumera varias ciudades y usa la hora límite más temprana", () => {
    const promise = resolveSameDayPromise(
      [
        { cityName: "Medellín", sameDayAvailable: true, cutoffHour: 14 },
        { cityName: "Bello", sameDayAvailable: true, cutoffHour: 12 },
        { cityName: "Envigado", sameDayAvailable: true, cutoffHour: 13 },
      ],
      TEN_AM_BOGOTA,
    );
    expect(promise.cities).toEqual(["Bello", "Envigado", "Medellín"]);
    expect(promise.earliestCutoffHour).toBe(12);
    expect(sameDayPromiseLabel(promise)).toBe("Entrega el mismo día en Bello, Envigado y Medellín");
  });

  it("siempre exige aclaración cuando promete algo", () => {
    const promise = resolveSameDayPromise(
      [{ cityName: "Medellín", sameDayAvailable: true, cutoffHour: null }],
      THREE_PM_BOGOTA,
    );
    // Sin hora límite la promesa sigue viva, pero nunca sin su aclaración.
    expect(promise.available).toBe(true);
    expect(promise.disclaimerNeeded).toBe(true);
  });

  it("no duplica una ciudad configurada dos veces", () => {
    const promise = resolveSameDayPromise(
      [
        { cityName: "Medellín", sameDayAvailable: true, cutoffHour: 14 },
        { cityName: "Medellín", sameDayAvailable: true, cutoffHour: 14 },
      ],
      TEN_AM_BOGOTA,
    );
    expect(promise.cities).toEqual(["Medellín"]);
  });
});
