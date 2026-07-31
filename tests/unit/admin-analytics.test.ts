import { describe, expect, it } from "vitest";
import { buildAdminAnalytics, percentChange } from "@/modules/analytics/admin-analytics";

describe("analítica administrativa", () => {
  const range = { from: new Date("2026-07-01T00:00:00Z"), to: new Date("2026-07-31T23:59:59Z") };
  const orders = [
    { id: "paid", status: "delivered", paymentMethod: "cash_on_delivery", shippingCity: "Medellín", total: 100_000, amountPaid: 100_000, couponCode: "QA10", utmSource: "instagram", utmCampaign: "julio", createdAt: new Date("2026-07-15T12:00:00Z") },
    { id: "pending", status: "confirmed", paymentMethod: "transfer_full", shippingCity: "Bello", total: 50_000, amountPaid: 0, couponCode: null, utmSource: null, utmCampaign: null, createdAt: new Date("2026-07-16T12:00:00Z") },
    { id: "cancelled", status: "cancelled", paymentMethod: "cash_on_delivery", shippingCity: "Medellín", total: 999_000, amountPaid: 0, couponCode: null, utmSource: null, utmCampaign: null, createdAt: new Date("2026-07-17T12:00:00Z") },
  ];

  it("separa valor vendido de ingresos cobrados y excluye cancelados", () => {
    const report = buildAdminAnalytics(orders, [
      { orderId: "paid", name: "Oslo", sku: "OSLO", quantity: 2, unitPrice: 50_000, discount: 0 },
      { orderId: "cancelled", name: "No cuenta", sku: "NO", quantity: 9, unitPrice: 99_000, discount: 0 },
    ], [], range);
    expect(report.summary).toMatchObject({ orders: 2, grossSales: 150_000, income: 100_000, averageTicket: 75_000 });
    expect(report.products).toEqual([{ label: "Oslo · OSLO", total: 2 }]);
    expect(report.cities).toHaveLength(2);
  });

  it("expresa comparaciones sin inventar porcentaje cuando la base es cero", () => {
    expect(percentChange(10, 0)).toBeNull();
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(120, 100)).toBe(20);
  });
});
