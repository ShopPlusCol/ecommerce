import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/infrastructure/db/schema";

let sqlite: Database.Database;
let db: ReturnType<typeof drizzle<typeof schema>>;

function applyMigration(file: string) {
  const source = readFileSync(resolve("drizzle", file), "utf8");
  for (const statement of source.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) {
    sqlite.exec(statement);
  }
}

beforeEach(() => {
  sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  applyMigration("0000_faulty_roxanne_simpson.sql");
  applyMigration("0001_fast_thunderball.sql");
  applyMigration("0002_gifted_ultragirl.sql");
  applyMigration("0003_thick_stark_industries.sql");
  applyMigration("0004_robust_silverclaw.sql");
  db = drizzle(sqlite, { schema });
});
afterEach(() => sqlite.close());

describe("persistencia crítica de Fase 3", () => {
  it("reserva inventario de forma condicional y evita sobreventa", async () => {
    const [product] = await db.insert(schema.products).values({ slug: "test", sku: "T-1", name: "Test", price: 1000 }).returning();
    const [item] = await db.insert(schema.inventoryItems).values({ productId: product.id, quantityOnHand: 2 }).returning();
    const first = await db.update(schema.inventoryItems).set({
      quantityReserved: sql`${schema.inventoryItems.quantityReserved} + 2`,
    }).where(sql`${schema.inventoryItems.id} = ${item.id} and ${schema.inventoryItems.quantityOnHand} - ${schema.inventoryItems.quantityReserved} >= 2`).returning();
    const second = await db.update(schema.inventoryItems).set({
      quantityReserved: sql`${schema.inventoryItems.quantityReserved} + 1`,
    }).where(sql`${schema.inventoryItems.id} = ${item.id} and ${schema.inventoryItems.quantityOnHand} - ${schema.inventoryItems.quantityReserved} >= 1`).returning();
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
  });

  it("mantiene la instantánea del pedido aunque cambie el catálogo", async () => {
    const [product] = await db.insert(schema.products).values({ slug: "snap", sku: "S-1", name: "Original", price: 49000 }).returning();
    const [customer] = await db.insert(schema.customers).values({ fullName: "Cliente", phone: "3000000000" }).returning();
    const [order] = await db.insert(schema.orders).values({
      orderNumber: "SPC-SNAPSHOT", customerId: customer.id, paymentMethod: "cash_on_delivery",
      lookupTokenHash: "hash", deliveryMethod: "delivery", customerFullName: "Cliente",
      customerPhone: "3000000000", subtotal: 49000, total: 49000, amountDueNow: 0, amountDueOnDelivery: 49000,
    }).returning();
    await db.insert(schema.orderItems).values({ orderId: order.id, productId: product.id, sku: "S-1", name: "Original", unitPrice: 49000, quantity: 1 });
    await db.update(schema.products).set({ name: "Nuevo", price: 99000 }).where(eq(schema.products.id, product.id));
    const [snapshot] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
    expect(snapshot).toMatchObject({ name: "Original", unitPrice: 49000 });
  });

  it("hace idempotentes checkout y webhooks duplicados", async () => {
    await db.insert(schema.idempotencyKeys).values({ key: "checkout-1", scope: "checkout" });
    const duplicateCheckout = await db.insert(schema.idempotencyKeys).values({ key: "checkout-1", scope: "checkout" }).onConflictDoNothing().returning();
    await db.insert(schema.webhookEvents).values({ provider: "mercado_pago", externalEventId: "evt-1", payload: {} });
    const duplicateWebhook = await db.insert(schema.webhookEvents).values({ provider: "mercado_pago", externalEventId: "evt-1", payload: {} }).onConflictDoNothing().returning();
    expect(duplicateCheckout).toHaveLength(0);
    expect(duplicateWebhook).toHaveLength(0);
  });

  it("publica una versión de página y persiste marca", async () => {
    const [page] = await db.insert(schema.pages).values({ slug: "inicio", title: "Inicio", isHome: true }).returning();
    const [version] = await db.insert(schema.pageVersions).values({ pageId: page.id, versionNumber: 1, publishedAt: new Date() }).returning();
    await db.insert(schema.pageSections).values({ pageVersionId: version.id, blockType: "hero", config: { title: "Hola" } });
    await db.update(schema.pages).set({ status: "published", publishedVersionId: version.id }).where(eq(schema.pages.id, page.id));
    await db.insert(schema.settings).values({ key: "brand", value: { name: "Marca real" } });
    const [saved] = await db.select().from(schema.settings).where(eq(schema.settings.key, "brand"));
    expect(saved.value).toEqual({ name: "Marca real" });
  });
});
