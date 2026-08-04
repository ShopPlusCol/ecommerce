import { describe, expect, it } from "vitest";
import { shouldEmitPageView, type PageViewMark } from "@/modules/analytics/page-view-policy";

const base = { path: "/", consentDecided: true, analytics: true, marketing: true, last: null as PageViewMark | null };

describe("política de PageView", () => {
  it("no emite nada antes de que la persona decida", () => {
    expect(shouldEmitPageView({ ...base, consentDecided: false })).toBe(false);
  });

  it("no emite nada si rechazó analítica y marketing", () => {
    expect(shouldEmitPageView({ ...base, analytics: false, marketing: false })).toBe(false);
  });

  it("emite una sola vez al aceptar todas", () => {
    const first = shouldEmitPageView(base);
    expect(first).toBe(true);
    const last = { path: "/", marketing: true };
    // Segundo render con el mismo estado: no debe volver a emitir.
    expect(shouldEmitPageView({ ...base, last })).toBe(false);
  });

  it("funciona aceptando solo marketing", () => {
    // Antes el efecto dependía de `consent.analytics`, así que este caso no
    // generaba ninguna vista.
    expect(shouldEmitPageView({ ...base, analytics: false, marketing: true })).toBe(true);
  });

  it("funciona aceptando solo analítica", () => {
    expect(shouldEmitPageView({ ...base, analytics: true, marketing: false })).toBe(true);
  });

  it("no duplica al hidratar una preferencia guardada", () => {
    // Estado inicial antes de leer localStorage: no decidido, no emite.
    expect(shouldEmitPageView({ ...base, consentDecided: false, analytics: false, marketing: false })).toBe(false);
    // Llega el valor guardado: emite una única vez.
    expect(shouldEmitPageView(base)).toBe(true);
    // Renders posteriores con el mismo estado: nada más.
    expect(shouldEmitPageView({ ...base, last: { path: "/", marketing: true } })).toBe(false);
  });

  it("emite una vez por navegación", () => {
    const last = { path: "/", marketing: true };
    expect(shouldEmitPageView({ ...base, path: "/catalogo", last })).toBe(true);
    expect(shouldEmitPageView({ ...base, path: "/catalogo", last: { path: "/catalogo", marketing: true } })).toBe(false);
  });

  it("reemite si el marketing se acepta estando ya en la página", () => {
    // La vista se emitió sin marketing; al aceptarlo, Meta debe recibir la
    // vista de la página en la que la persona está.
    const last = { path: "/catalogo", marketing: false };
    expect(shouldEmitPageView({ ...base, path: "/catalogo", last })).toBe(true);
  });

  it("no reemite si el marketing se revoca", () => {
    const last = { path: "/catalogo", marketing: true };
    expect(shouldEmitPageView({ ...base, path: "/catalogo", marketing: false, last })).toBe(false);
  });
});
