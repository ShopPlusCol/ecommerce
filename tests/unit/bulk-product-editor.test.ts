import { describe, expect, it } from "vitest";
import { validateBulkProductUpdates } from "@/modules/catalog/bulk-editor";

const row = {
  id: "product-1",
  updatedAt: new Date("2026-07-29T12:00:00.000Z").toISOString(),
  name: "Producto uno",
  slug: "producto-uno",
  sku: "SKU-1",
  status: "draft" as const,
  price: 49_000,
  compareAtPrice: 59_000,
  shortDescription: "Descripción",
  colorFamilyId: null,
  categoryIds: ["category-1"],
  limitCategoryId: null,
  maxUnitsPerCategoryUnit: null,
  imageUrl: "/uploads/producto.webp",
  imageAlt: "Producto uno",
  lowStockThreshold: 5,
  featured: false,
  allowBackorder: false,
};

describe("validación del editor masivo", () => {
  it("acepta una cantidad de filas sin un límite funcional fijo", () => {
    const rows = Array.from({ length: 1_200 }, (_, index) => ({
      ...row,
      id: `product-${index}`,
      slug: `producto-${index}`,
      sku: `SKU-${index}`,
    }));
    expect(validateBulkProductUpdates(rows)).toHaveLength(1_200);
  });

  it("rechaza SKU repetido y precios comparativos inválidos", () => {
    expect(() => validateBulkProductUpdates([row, { ...row, id: "product-2", slug: "producto-dos" }])).toThrow(/SKU/);
    expect(() => validateBulkProductUpdates([{ ...row, compareAtPrice: row.price }])).toThrow(/precio comparativo/i);
  });
});
