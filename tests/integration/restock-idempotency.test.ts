import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Devolver el inventario de un pedido tiene que poder ejecutarse dos veces
 * sin devolver el stock dos veces.
 *
 * Dejó de ser teórico al permitir saltos directos entre estados: antes los
 * estados avanzaban en secuencia y `restockOrderInventory` no podía
 * llamarse dos veces por el mismo pedido; ahora sí (p. ej. cancelado →
 * devuelto), y la rama de reservas ya consumidas no reclamaba la reserva.
 */
let tempDir: string;
let dbPath: string;

function applyAllMigrations(path: string) {
  const sqlite = new Database(path);
  sqlite.pragma("foreign_keys = ON");
  for (const file of readdirSync(resolve("drizzle")).filter((f) => f.endsWith(".sql")).sort()) {
    const source = readFileSync(resolve("drizzle", file), "utf8");
    for (const statement of source.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean)) {
      sqlite.exec(statement);
    }
  }
  sqlite.close();
}

function seedOrderWithReservation(status: "active" | "consumed") {
  const sqlite = new Database(dbPath);
  const now = Date.now();
  sqlite.prepare(
    `insert into products (id, slug, sku, name, price, status, created_at, updated_at)
     values ('p1','tono','SKU-1','Tono', 49000, 'active', ?, ?)`,
  ).run(now, now);
  sqlite.prepare(
    `insert into inventory_items (id, product_id, quantity_on_hand, quantity_reserved, quantity_sold, created_at, updated_at)
     values ('inv1','p1', 10, ?, ?, ?, ?)`,
  ).run(status === "active" ? 3 : 0, status === "consumed" ? 3 : 0, now, now);
  sqlite.prepare(
    `insert into orders (id, order_number, status, payment_status, payment_method, delivery_method,
       lookup_token_hash, customer_full_name, customer_phone, subtotal, total, amount_due_now, created_at, updated_at)
     values ('o1','TEST-1','confirmed','unpaid','cash_on_delivery','delivery','h','Cliente','300', 49000, 49000, 0, ?, ?)`,
  ).run(now, now);
  sqlite.prepare(
    `insert into inventory_reservations (id, inventory_item_id, order_id, quantity, status, expires_at, created_at, updated_at)
     values ('r1','inv1','o1', 3, ?, ?, ?, ?)`,
  ).run(status, now + 1_000_000, now, now);
  sqlite.close();
}

function readStock() {
  const sqlite = new Database(dbPath, { readonly: true });
  const item = sqlite.prepare("select quantity_on_hand, quantity_reserved, quantity_sold from inventory_items where id='inv1'").get() as {
    quantity_on_hand: number;
    quantity_reserved: number;
    quantity_sold: number;
  };
  const reservation = sqlite.prepare("select status from inventory_reservations where id='r1'").get() as { status: string };
  const movements = sqlite.prepare("select count(*) c from inventory_movements where reference_order_id='o1'").get() as { c: number };
  sqlite.close();
  return { ...item, reservationStatus: reservation.status, movements: movements.c };
}

beforeEach(() => {
  vi.resetModules();
  tempDir = mkdtempSync(join(tmpdir(), "shoppluscol-restock-"));
  dbPath = join(tempDir, "test.db");
  applyAllMigrations(dbPath);
  process.env.SQLITE_PATH = dbPath;
});

afterEach(() => {
  delete process.env.SQLITE_PATH;
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // El módulo cachea su conexión SQLite; en Windows eso impide borrar.
  }
});

describe("devolución de inventario al stock", () => {
  it("una reserva ya vendida se devuelve una sola vez", async () => {
    seedOrderWithReservation("consumed");
    const { restockOrderInventory } = await import("@/modules/inventory/reservations");

    await restockOrderInventory("o1", "Pedido devuelto");
    const first = readStock();
    expect(first.quantity_on_hand).toBe(13);
    expect(first.quantity_sold).toBe(0);
    expect(first.reservationStatus).toBe("restocked");

    // Segundo paso entre estados devueltos (p. ej. cancelado → devuelto).
    await restockOrderInventory("o1", "Pedido devuelto otra vez");
    const second = readStock();
    expect(second.quantity_on_hand, "el stock no puede devolverse dos veces").toBe(13);
    expect(second.quantity_sold).toBe(0);
    expect(second.movements, "no debe registrarse un segundo movimiento").toBe(1);
  });

  it("una reserva activa se libera una sola vez", async () => {
    seedOrderWithReservation("active");
    const { restockOrderInventory } = await import("@/modules/inventory/reservations");

    await restockOrderInventory("o1", "Pedido cancelado");
    const first = readStock();
    expect(first.quantity_reserved).toBe(0);
    expect(first.reservationStatus).toBe("released");

    await restockOrderInventory("o1", "Pedido cancelado otra vez");
    const second = readStock();
    expect(second.quantity_reserved).toBe(0);
    expect(second.movements).toBe(1);
  });
});
