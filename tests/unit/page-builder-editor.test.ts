import { describe, expect, it } from "vitest";
import { blockTypes, defaultBlockConfig, parseBlockConfig } from "@/modules/page-builder/editor";

describe("contrato del editor visual", () => {
  it("genera una configuración publicable para cada tipo de bloque", () => {
    for (const type of blockTypes) {
      expect(parseBlockConfig(type, defaultBlockConfig(type))).toEqual(defaultBlockConfig(type));
    }
  });

  it("rechaza tipos que la tienda no sabe renderizar", () => {
    expect(() => parseBlockConfig("html_arbitrario", {})).toThrow(/no es compatible/i);
  });

  it("rechaza enlaces externos y colecciones demasiado grandes", () => {
    expect(() => parseBlockConfig("cta", { title: "Comprar", ctaLabel: "Ir", ctaHref: "https://example.com" })).toThrow();
    expect(() => parseBlockConfig("product_collection", {
      title: "Todos",
      source: { filter: "featured" },
      limit: 100,
    })).toThrow();
  });
});
