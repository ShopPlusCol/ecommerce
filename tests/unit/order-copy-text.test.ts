import { describe, expect, it } from "vitest";
import { buildOrderCopyText, type OrderCopyData } from "@/modules/admin/order-copy-text";

const base: OrderCopyData = {
  fullName: "Valentina Restrepo",
  phone: "3001234567",
  addressLine: "Calle 10 # 20-30",
  addressComplement: "Torre 2, apto 501",
  neighborhood: "Laureles",
  city: "Medellín",
  department: "Antioquia",
  deliveryInstructions: "Portería azul, timbre 501",
  lines: [{ name: "Amazon Brown", quantity: 1, unitPrice: 49000 }],
  productsSubtotal: 49000,
  shippingFee: 8000,
  discountTotal: 0,
  total: 57000,
  paymentMethod: "cash_on_delivery",
  amountDueNow: 0,
  amountDueOnDelivery: 57000,
};

describe("texto del pedido listo para copiar", () => {
  it("respeta el orden exacto de los campos", () => {
    const lines = buildOrderCopyText(base).split("\n");
    expect(lines[0]).toBe("Nombre completo: Valentina Restrepo");
    expect(lines[1]).toBe("Teléfono: 3001234567");
    expect(lines[2]).toBe("Dirección: Calle 10 # 20-30");
    expect(lines[3]).toBe("Apartamento, torre, bloque: Torre 2, apto 501");
    expect(lines[4]).toBe("Barrio o sector: Laureles");
    expect(lines[5]).toBe("Ciudad o municipio, Departamento: Medellín, Antioquia");
  });

  it("usa formato colombiano en todas las cifras", () => {
    const text = buildOrderCopyText(base);
    expect(text).toContain("- 1 x Amazon Brown — $49.000");
    expect(text).toContain("Subtotal de productos: $49.000");
    expect(text).toContain("Domicilio: $8.000");
    expect(text).toContain("Total a pagar: $57.000");
  });

  it("traduce la forma de pago a lenguaje humano", () => {
    // El destinatario es una persona: "cash_on_delivery" no le dice nada.
    const text = buildOrderCopyText(base);
    expect(text).toContain("Forma de pago: Pago contraentrega");
    expect(text).not.toContain("cash_on_delivery");
  });

  it("distingue lo que se paga ahora de lo que se paga al recibir", () => {
    const text = buildOrderCopyText(base);
    expect(text).toContain("Pago ahora: $0");
    expect(text).toContain("Pago al recibir: $57.000");
  });

  it("dice 'No aplica' cuando no hay apartamento o torre", () => {
    const text = buildOrderCopyText({ ...base, addressComplement: null });
    expect(text).toContain("Apartamento, torre, bloque: No aplica");
  });

  it("dice 'Sin indicaciones adicionales' cuando no hay indicaciones", () => {
    expect(buildOrderCopyText({ ...base, deliveryInstructions: "" })).toContain("Sin indicaciones adicionales");
    expect(buildOrderCopyText({ ...base, deliveryInstructions: null })).toContain("Sin indicaciones adicionales");
  });

  it("lista varios productos con su cantidad y subtotal", () => {
    const text = buildOrderCopyText({
      ...base,
      lines: [
        { name: "Amazon Brown", quantity: 2, unitPrice: 49000 },
        { name: "Solución multipropósito 120ml", quantity: 1, unitPrice: 28000 },
      ],
      productsSubtotal: 126000,
      total: 134000,
      amountDueOnDelivery: 134000,
    });
    expect(text).toContain("- 2 x Amazon Brown — $98.000");
    expect(text).toContain("- 1 x Solución multipropósito 120ml — $28.000");
    expect(text).toContain("Subtotal de productos: $126.000");
  });

  it("muestra el descuento siempre, aunque sea cero", () => {
    // Omitirlo en unos pedidos y no en otros hace dudar de si hubo
    // descuento o si se olvidó anotarlo.
    expect(buildOrderCopyText(base)).toContain("Descuento: $0");
    expect(buildOrderCopyText({ ...base, discountTotal: 5000 })).toContain("Descuento: $5.000");
  });

  it("no filtra identificadores internos ni códigos técnicos", () => {
    const text = buildOrderCopyText(base);
    expect(text).not.toMatch(/\bid\b|slug|\{|\}|_id/i);
  });

  it("no rompe cuando faltan campos opcionales del checkout", () => {
    // El comercio puede desactivar campos; el texto debe seguir siendo
    // legible en vez de mostrar "null".
    const text = buildOrderCopyText({
      ...base,
      addressComplement: null,
      deliveryInstructions: null,
      neighborhood: null,
    });
    expect(text).not.toContain("null");
    expect(text).not.toContain("undefined");
    expect(text).toContain("Barrio o sector: —");
  });
});
