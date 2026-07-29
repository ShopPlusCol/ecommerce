import { describe, expect, it } from "vitest";
import { fallbackGeometry, geometryFromFaceLandmarks, type NormalizedPoint } from "@/modules/try-on/geometry";

describe("geometría del simulador", () => {
  it("entrega una posición manual segura cuando no hay detección", () => {
    const geometry = fallbackGeometry();
    expect(geometry.right.centerX).toBeLessThan(geometry.left.centerX);
    expect(geometry.left.radiusX).toBeGreaterThan(0);
  });

  it("rechaza una malla facial incompleta", () => {
    expect(() => geometryFromFaceLandmarks([])).toThrow(/puntos completos/i);
  });

  it("calcula centro, radios y rotación con 478 puntos", () => {
    const points: NormalizedPoint[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
    [468, 469, 470, 471, 472].forEach((index, offset) => {
      points[index] = { x: 0.38 + (offset - 2) * 0.005, y: 0.42 + (offset % 2) * 0.003 };
    });
    [473, 474, 475, 476, 477].forEach((index, offset) => {
      points[index] = { x: 0.62 + (offset - 2) * 0.005, y: 0.43 + (offset % 2) * 0.003 };
    });
    const geometry = geometryFromFaceLandmarks(points);
    expect(geometry.right.centerX).toBeCloseTo(0.38);
    expect(geometry.left.centerX).toBeCloseTo(0.62);
    expect(geometry.left.rotation).toBeGreaterThan(0);
  });
});
