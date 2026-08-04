import { describe, expect, it } from "vitest";
import { buildWhatsAppCartMessage, buildWhatsAppUrl } from "@/modules/whatsapp/cart-message";
import { money } from "@/domain/value-objects/money";
import type { CartLine } from "@/domain/entities/cart";
import type { CartTotals } from "@/domain/services/cart-pricing";
import { DEFAULT_SITE_TEXTS } from "@/modules/settings/site-texts";

/**
 * Se valida el **texto y la URL generados**, nunca enviando un mensaje:
 * el objetivo es que quien recibe el WhatsApp pueda actuar sin volver a
 * preguntar el precio, la cantidad o si el domicilio va aparte.
 */
const lines: CartLine[] = [
  {
    productId: "p1",
    variantId: null,
    slug: "amazon-brown",
    sku: "SPC-LEN-1",
    name: "Amazon Brown",
    colorFamilyName: "Miel / Café",
    unitPrice: money(49000),
    compareAtPrice: null,
    quantity: 2,
    imageUrl: null,
    isGift: false,
    allowBackorder: false,
    maxStock: 10,
    categoryIds: [],
    purchaseLimit: null,
  },
];

const totals: CartTotals = {
  subtotal: money(98000),
  discountTotal: money(0),
  couponDiscount: money(0),
  rewardDiscount: money(0),
  productsTotal: money(98000),
  freeShipping: false,
  couponError: null,
};

describe("mensaje de WhatsApp del carrito", () => {
  const message = buildWhatsAppCartMessage({
    lines,
    totals,
    intro: DEFAULT_SITE_TEXTS.whatsappCartIntro,
    closingNote: DEFAULT_SITE_TEXTS.whatsappCartClosingNote,
    destination: { city: "Medellín", neighborhood: "Laureles" },
  });

  it("incluye producto, cantidad y total en formato colombiano", () => {
    expect(message).toContain("2 × Amazon Brown");
    expect(message).toContain("$98.000");
  });

  it("dice que el envío está por calcular en vez de inventar una tarifa", () => {
    expect(message).toContain("Envío: por calcular según mi dirección");
  });

  it("incluye la ubicación cuando ya se conoce", () => {
    expect(message).toContain("Ciudad: Medellín");
    expect(message).toContain("Barrio: Laureles");
  });

  it("aclara que es un resumen del carrito y no un pedido pagado", () => {
    expect(message).toContain("no un pedido pagado");
  });

  it("no filtra identificadores internos ni códigos técnicos", () => {
    expect(message).not.toContain("p1");
    expect(message).not.toContain("SPC-LEN-1");
    expect(message).not.toMatch(/\{|\}|null|undefined/);
  });
});

describe("plantilla de WhatsApp desde la ficha de producto", () => {
  const template = DEFAULT_SITE_TEXTS.whatsappProductTemplate;

  it("está escrita con intención de compra, no como consulta abierta", () => {
    expect(template).toMatch(/quiero comprar/i);
  });

  it("tiene los marcadores de producto, precio y cantidad", () => {
    expect(template).toContain("{producto}");
    expect(template).toContain("{precio}");
    expect(template).toContain("{cantidad}");
  });

  it("menciona qué incluye y que el domicilio va aparte", () => {
    expect(template).toContain("{incluye}");
    expect(template).toMatch(/domicilio/i);
  });

  it("deja un hueco explícito para la ubicación", () => {
    // Sin esto la conversación empieza preguntando "¿dónde estás?".
    expect(template).toMatch(/ubicado\(a\) en ____/);
  });

  it("al rellenarla no queda ningún marcador sin sustituir", () => {
    const filled = template
      .replace("{producto}", "Amazon Brown")
      .replace("{precio}", "$49.000")
      .replace("{cantidad}", "2")
      .replace("{incluye}", "par de lentes + estuche sencillo")
      .replace("{url}", "https://tienda.test/productos/amazon-brown");
    expect(filled).not.toMatch(/\{[a-z]+\}/);
    expect(filled).toContain("Amazon Brown");
    expect(filled).toContain("$49.000");
  });
});

describe("URL de WhatsApp", () => {
  it("apunta al número de la marca y lleva el mensaje codificado", () => {
    const url = buildWhatsAppUrl("Hola, quiero comprar Amazon Brown", "573001112233");
    expect(url.startsWith("https://wa.me/573001112233?text=")).toBe(true);
    expect(url).toContain(encodeURIComponent("quiero comprar"));
  });

  it("no rompe con acentos, saltos de línea ni el símbolo de peso", () => {
    const url = buildWhatsAppUrl("Tono café\nPrecio: $49.000", "573001112233");
    const text = decodeURIComponent(new URL(url).searchParams.get("text") ?? "");
    expect(text).toContain("Tono café");
    expect(text).toContain("$49.000");
    expect(text).toContain("\n");
  });
});
