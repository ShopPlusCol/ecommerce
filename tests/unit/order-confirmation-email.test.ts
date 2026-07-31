import { describe, expect, it } from "vitest";
import { buildOrderConfirmationEmail } from "@/modules/notifications/order-confirmation-email";
import { ConfiguredNotificationProvider } from "@/infrastructure/notifications/configured-notification-provider";
import type { DemoOrder } from "@/modules/checkout/order-types";

const order: DemoOrder = {
  orderNumber: "SPC-TEST-0001",
  createdAt: "2026-08-01T00:00:00.000Z",
  isDemo: false,
  lookupToken: "token-abc",
  checkoutUrl: null,
  manualTransfer: null,
  contact: {
    fullName: "Cliente Prueba",
    phone: "3001234567",
    email: "cliente@example.test",
    addressLine: "Calle 10 # 20-30",
    addressComplement: "",
    deliveryInstructions: "",
  },
  destination: { country: "CO", department: "Antioquia", city: "Medellín", neighborhood: "Chapinero" },
  paymentMethod: "cash_on_delivery",
  quote: {
    ruleId: "rule-1",
    ruleLevel: "city",
    matchingZoneIds: ["zone-1"],
    fee: { amount: 8000, currency: "COP" },
    feeSource: null,
    freeShippingThreshold: null,
    cashOnDeliveryAllowed: true,
    requiresAdvancePayment: false,
    advancePercentage: null,
    estimatedBusinessDaysMin: 0,
    estimatedBusinessDaysMax: 1,
    sameDayEligible: true,
    sameDayCutoffHour: 14,
    customerMessage: "",
    allowedPaymentMethods: undefined,
  },
  items: [
    { productId: "p1", sku: "SKU-1", name: "Amazon Brown", colorFamilyName: null, unitPrice: 49000, quantity: 1, imageUrl: null },
  ],
  summary: {
    subtotal: { amount: 49000, currency: "COP" },
    couponDiscount: { amount: 0, currency: "COP" },
    rewardDiscount: { amount: 0, currency: "COP" },
    discountTotal: { amount: 0, currency: "COP" },
    productsTotal: { amount: 49000, currency: "COP" },
    couponError: null,
    shippingFee: { amount: 8000, currency: "COP" },
    freeShipping: false,
    total: { amount: 57000, currency: "COP" },
    amountDueNow: { amount: 0, currency: "COP" },
    amountDueOnDelivery: { amount: 57000, currency: "COP" },
    paymentMethod: "cash_on_delivery",
    paymentReason: "Pagas todo al recibir el pedido.",
  },
};

describe("correo de confirmación de pedido", () => {
  it("incluye el número de pedido, el código privado y el total en asunto/texto/html", () => {
    const email = buildOrderConfirmationEmail(order, "ShopPlusCol", "https://tienda.example.com");
    expect(email.subject).toContain("SPC-TEST-0001");
    expect(email.subject).toContain("ShopPlusCol");
    expect(email.text).toContain("token-abc");
    expect(email.text).toContain("Amazon Brown");
    expect(email.text).toContain("$57.000");
    expect(email.html).toContain("SPC-TEST-0001");
    expect(email.html).toContain("Amazon Brown");
  });

  it("escapa HTML en campos provistos por el cliente para evitar inyección", () => {
    const malicious: DemoOrder = {
      ...order,
      contact: { ...order.contact, fullName: '<script>alert(1)</script>' },
    };
    const email = buildOrderConfirmationEmail(malicious, "ShopPlusCol", "https://tienda.example.com");
    expect(email.html).not.toContain("<script>alert(1)</script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});

describe("ConfiguredNotificationProvider", () => {
  it("no envía ni lanza si SMTP no está configurado", async () => {
    const original = { host: process.env.SMTP_HOST, user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    const provider = new ConfiguredNotificationProvider();
    expect(provider.isConfigured()).toBe(false);
    const result = await provider.send({ event: "order_created", to: "cliente@example.test", subject: "Prueba", data: {} });
    expect(result).toEqual({ delivered: false, reason: "SMTP no configurado." });
    if (original.host) process.env.SMTP_HOST = original.host;
    if (original.user) process.env.SMTP_USER = original.user;
    if (original.pass) process.env.SMTP_PASSWORD = original.pass;
  });

  it("nunca lanza, incluso si el servidor SMTP configurado es inalcanzable", async () => {
    const original = { host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD };
    process.env.SMTP_HOST = "127.0.0.1";
    process.env.SMTP_PORT = "1";
    process.env.SMTP_USER = "no-existe";
    process.env.SMTP_PASSWORD = "no-existe";
    const provider = new ConfiguredNotificationProvider();
    expect(provider.isConfigured()).toBe(true);
    const result = await provider.send({ event: "order_created", to: "cliente@example.test", subject: "Prueba", data: {} });
    expect(result.delivered).toBe(false);
    expect(result.reason).toBeTruthy();
    process.env.SMTP_HOST = original.host;
    process.env.SMTP_PORT = original.port;
    process.env.SMTP_USER = original.user;
    process.env.SMTP_PASSWORD = original.pass;
  });
});
