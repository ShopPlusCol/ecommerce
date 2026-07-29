import { eq, sql } from "drizzle-orm";
import { MercadoPagoProvider } from "@/infrastructure/payments/mercado-pago-provider";
import { getRuntimeDb } from "@/infrastructure/db/client";
import {
  inventoryItems,
  inventoryMovements,
  inventoryReservations,
  orders,
  analyticsEvents,
  consentRecords,
  payments,
  webhookEvents,
} from "@/infrastructure/db/schema";
import { MetaConversionsProvider } from "@/infrastructure/analytics/meta-conversions-provider";

export async function POST(request: Request) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!token || !secret) return Response.json({ error: "Integración no configurada." }, { status: 503 });
  const rawBody = await request.text();
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("data_id");
  const provider = new MercadoPagoProvider(token, secret, process.env.MERCADO_PAGO_TEST_MODE !== "false");
  if (!provider.verifyWebhookSignature({
    signatureHeader: request.headers.get("x-signature"),
    requestId: request.headers.get("x-request-id"),
    dataId,
  })) return Response.json({ error: "Firma inválida." }, { status: 401 });

  const event = provider.parseWebhookPayload(rawBody);
  const db = await getRuntimeDb();
  const [claimed] = await db.insert(webhookEvents).values({
    provider: "mercado_pago",
    externalEventId: event.rawEventId,
    payload: JSON.parse(rawBody) as Record<string, unknown>,
  }).onConflictDoNothing().returning();
  if (!claimed) return Response.json({ ok: true, duplicate: true });

  try {
    const authoritative = await provider.getPayment(event.providerPaymentId);
    const [payment] = await db.select().from(payments).where(eq(payments.externalReference, authoritative.external_reference)).limit(1);
    if (!payment) throw new Error("Pago sin pedido local asociado.");
    const mapped = authoritative.status === "approved" ? "approved"
      : authoritative.status === "rejected" ? "rejected"
      : authoritative.status === "in_process" ? "in_process" : "pending";
    const newlyApproved = mapped === "approved" && payment.status !== "approved";
    await db.update(payments).set({
      providerPaymentId: String(authoritative.id),
      status: mapped,
      updatedAt: new Date(),
    }).where(eq(payments.id, payment.id));
    if (newlyApproved) {
      const reservations = await db.select().from(inventoryReservations).where(eq(inventoryReservations.orderId, payment.orderId));
      for (const reservation of reservations.filter((item) => item.status === "active")) {
        await db.update(inventoryItems).set({
          quantityOnHand: sql`${inventoryItems.quantityOnHand} - ${reservation.quantity}`,
          quantityReserved: sql`max(0, ${inventoryItems.quantityReserved} - ${reservation.quantity})`,
          quantitySold: sql`${inventoryItems.quantitySold} + ${reservation.quantity}`,
          updatedAt: new Date(),
        }).where(eq(inventoryItems.id, reservation.inventoryItemId));
        await db.update(inventoryReservations).set({ status: "consumed", updatedAt: new Date() }).where(eq(inventoryReservations.id, reservation.id));
        await db.insert(inventoryMovements).values({
          inventoryItemId: reservation.inventoryItemId,
          type: "sale",
          quantityDelta: -reservation.quantity,
          referenceOrderId: payment.orderId,
          reason: "Pago confirmado por webhook verificado de Mercado Pago",
        });
      }
      await db.update(orders).set({
        paymentStatus: "paid",
        status: "confirmed",
        amountPaid: payment.amount,
        updatedAt: new Date(),
      }).where(eq(orders.id, payment.orderId));
      const [order] = await db.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1);
      const [consent] = order?.customerId
        ? await db.select().from(consentRecords).where(eq(consentRecords.subjectId, order.customerId)).limit(1)
        : [];
      const eventId = `purchase:${payment.id}`;
      const meta = new MetaConversionsProvider();
      let sentToServer = false;
      if (order && consent?.analytics && meta.isEnabled()) {
        await meta.trackServerEvent({
          eventName: "Purchase",
          eventId,
          eventSourceUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/confirmacion`,
          value: order.total,
          currency: "COP",
          orderId: order.id,
          userData: { email: order.customerEmail ?? undefined, phone: order.customerPhone },
        });
        sentToServer = true;
      }
      await db.insert(analyticsEvents).values({
        eventName: "Purchase",
        eventId,
        orderId: order?.id,
        value: order?.total,
        sentToServer,
        sentToBrowser: false,
        utmSource: order?.utmSource,
        utmCampaign: order?.utmCampaign,
      }).onConflictDoNothing();
    }
    await db.update(webhookEvents).set({ status: "processed", processedAt: new Date() }).where(eq(webhookEvents.id, claimed.id));
    return Response.json({ ok: true });
  } catch (error) {
    await db.update(webhookEvents).set({
      status: "failed",
      error: error instanceof Error ? error.message : "Error de conciliación",
    }).where(eq(webhookEvents.id, claimed.id));
    return Response.json({ error: "No fue posible conciliar el evento." }, { status: 500 });
  }
}
