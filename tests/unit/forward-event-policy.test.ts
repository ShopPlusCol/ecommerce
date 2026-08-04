import { describe, expect, it } from "vitest";
import {
  CLIENT_FORWARDABLE_EVENTS,
  forwardEventSchema,
  isAllowedEventSourceUrl,
} from "@/modules/analytics/forward-event-policy";

const valid = {
  eventName: "ViewContent" as const,
  eventId: "3f1a9c2e-5b6d-4f7a-8c9e-0d1b2a3c4d5e",
  eventSourceUrl: "https://tienda.test/productos/amazon-brown",
  payload: { contentIds: ["prod-1"] },
};

describe("validación del reenvío a Conversions API", () => {
  it("Purchase nunca puede reenviarse desde el cliente", () => {
    expect(CLIENT_FORWARDABLE_EVENTS).not.toContain("Purchase");
    const result = forwardEventSchema.safeParse({ ...valid, eventName: "Purchase" });
    expect(result.success).toBe(false);
  });

  it("acepta un evento bien formado", () => {
    expect(forwardEventSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza un importe enviado por el cliente", () => {
    // El importe se resuelve en servidor; aceptar el del navegador
    // permitiría inventar el ROAS de una campaña.
    const result = forwardEventSchema.safeParse({
      ...valid,
      payload: { contentIds: ["prod-1"], value: 999_999 },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza campos que no corresponden al tipo de evento", () => {
    // Un PageView con lista de productos es una señal manipulada.
    expect(forwardEventSchema.safeParse({ ...valid, eventName: "PageView", payload: { contentIds: ["p"] } }).success).toBe(false);
    // ViewContent es de un solo producto.
    expect(forwardEventSchema.safeParse({ ...valid, payload: { contentIds: ["a", "b"] } }).success).toBe(false);
  });

  it("no acepta texto libre de búsqueda", () => {
    const result = forwardEventSchema.safeParse({
      ...valid,
      eventName: "Search",
      payload: { search_string: "algo que escribió la persona" },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza identificadores de evento con forma inesperada", () => {
    expect(forwardEventSchema.safeParse({ ...valid, eventId: "corto" }).success).toBe(false);
    expect(forwardEventSchema.safeParse({ ...valid, eventId: "con espacios y <script>" }).success).toBe(false);
    expect(forwardEventSchema.safeParse({ ...valid, eventId: "x".repeat(200) }).success).toBe(false);
  });

  it("limita la cantidad de productos por evento", () => {
    const many = Array.from({ length: 60 }, (_, i) => `p-${i}`);
    expect(forwardEventSchema.safeParse({ ...valid, eventName: "AddToCart", payload: { contentIds: many } }).success).toBe(false);
  });

  it("acepta cantidades solo dentro de un rango razonable", () => {
    const ok = forwardEventSchema.safeParse({
      ...valid,
      eventName: "AddToCart",
      payload: { contentIds: ["p1"], quantities: [3] },
    });
    expect(ok.success).toBe(true);
    const bad = forwardEventSchema.safeParse({
      ...valid,
      eventName: "AddToCart",
      payload: { contentIds: ["p1"], quantities: [0] },
    });
    expect(bad.success).toBe(false);
  });
});

describe("origen permitido de la URL del evento", () => {
  const allowed = ["https://tienda.test", "http://localhost:3000"];

  it("acepta el dominio configurado", () => {
    expect(isAllowedEventSourceUrl("https://tienda.test/catalogo", allowed)).toBe(true);
    expect(isAllowedEventSourceUrl("http://localhost:3000/carrito", allowed)).toBe(true);
  });

  it("rechaza dominios externos arbitrarios", () => {
    // Sin esto cualquiera podría atribuir eventos desde un sitio ajeno.
    expect(isAllowedEventSourceUrl("https://sitio-ajeno.example/x", allowed)).toBe(false);
  });

  it("no se deja engañar por un subdominio parecido", () => {
    expect(isAllowedEventSourceUrl("https://tienda.test.evil.example/x", allowed)).toBe(false);
    expect(isAllowedEventSourceUrl("https://eviltienda.test/x", allowed)).toBe(false);
  });

  it("distingue el puerto y el esquema", () => {
    expect(isAllowedEventSourceUrl("http://localhost:9999/x", allowed)).toBe(false);
  });

  it("rechaza una URL inválida o vacía", () => {
    expect(isAllowedEventSourceUrl("no-es-una-url", allowed)).toBe(false);
    expect(isAllowedEventSourceUrl("https://tienda.test/x", [null, undefined])).toBe(false);
  });
});
