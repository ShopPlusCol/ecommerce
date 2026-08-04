import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * El envío real a Meta se sustituye: lo que se prueba aquí es la garantía
 * de "una sola compra por pedido", no la API de Meta.
 */
const sendMetaServerEvent = vi.fn(async () => ({ ok: true as const }));
vi.mock("@/modules/analytics/meta-server-events", () => ({
  sendMetaServerEvent: (...args: unknown[]) => sendMetaServerEvent(...(args as [])),
}));

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

beforeEach(() => {
  vi.resetModules();
  sendMetaServerEvent.mockClear();
  tempDir = mkdtempSync(join(tmpdir(), "shoppluscol-purchase-"));
  dbPath = join(tempDir, "test.db");
  applyAllMigrations(dbPath);
  // `getLocalDb` lee esta variable y cachea la conexión por módulo; el
  // `resetModules` de arriba hace que cada prueba abra la suya.
  process.env.SQLITE_PATH = dbPath;
});

afterEach(() => {
  delete process.env.SQLITE_PATH;
  // El módulo bajo prueba cachea su conexión SQLite y no la cierra; en
  // Windows eso impide borrar el archivo. La carpeta es temporal del
  // sistema, así que no pasa nada si queda: la limpieza es best-effort y
  // nunca debe hacer fallar la prueba.
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Ignorar.
  }
});

async function importSubject() {
  return (await import("@/modules/analytics/purchase-event")).emitPurchaseEventOnce;
}

const baseInput = {
  orderId: "order-1",
  value: 58000,
  eventSourceUrl: "https://tienda.test/checkout/confirmacion",
  email: "clienta@example.com",
  phone: "3001234567",
  marketingConsent: true,
};

describe("evento Purchase", () => {
  it("envía la compra una sola vez por pedido", async () => {
    const emitPurchaseEventOnce = await importSubject();

    const first = await emitPurchaseEventOnce(baseInput);
    expect(first).toEqual({ status: "sent" });
    expect(sendMetaServerEvent).toHaveBeenCalledTimes(1);

    // Segunda entrega del mismo webhook, o recarga de la confirmación.
    const second = await emitPurchaseEventOnce(baseInput);
    expect(second).toEqual({ status: "already_recorded" });
    expect(sendMetaServerEvent).toHaveBeenCalledTimes(1);
  });

  it("no envía nada sin consentimiento de marketing", async () => {
    const emitPurchaseEventOnce = await importSubject();

    const result = await emitPurchaseEventOnce({ ...baseInput, marketingConsent: false });
    expect(result).toEqual({ status: "no_consent" });
    expect(sendMetaServerEvent).not.toHaveBeenCalled();

    // Y no deja rastro que impida enviarla si más tarde sí hay consentimiento.
    const sqlite = new Database(dbPath, { readonly: true });
    const rows = sqlite.prepare("select count(*) as c from analytics_events").get() as { c: number };
    sqlite.close();
    expect(rows.c).toBe(0);
  });

  it("usa un event_id estable derivado del pedido", async () => {
    const emitPurchaseEventOnce = await importSubject();
    await emitPurchaseEventOnce(baseInput);

    const sqlite = new Database(dbPath, { readonly: true });
    const row = sqlite.prepare("select event_id, sent_to_server from analytics_events").get() as {
      event_id: string;
      sent_to_server: number;
    };
    sqlite.close();

    // Anclado al pedido, no al pago: un pedido con dos pagos sigue siendo
    // una sola compra, y el navegador puede deduplicar contra el mismo id.
    expect(row.event_id).toBe("purchase:order-1");
    expect(row.sent_to_server).toBe(1);
  });

  it("dos compras distintas sí se reportan por separado", async () => {
    const emitPurchaseEventOnce = await importSubject();
    await emitPurchaseEventOnce(baseInput);
    await emitPurchaseEventOnce({ ...baseInput, orderId: "order-2" });
    expect(sendMetaServerEvent).toHaveBeenCalledTimes(2);
  });

  it("deja la compra registrada como no enviada si Meta falla", async () => {
    sendMetaServerEvent.mockResolvedValueOnce({ ok: false, error: "Meta CAPI respondió 500" } as never);
    const emitPurchaseEventOnce = await importSubject();

    const result = await emitPurchaseEventOnce(baseInput);
    expect(result).toEqual({ status: "failed", error: "Meta CAPI respondió 500" });

    const sqlite = new Database(dbPath, { readonly: true });
    const row = sqlite.prepare("select sent_to_server from analytics_events").get() as { sent_to_server: number };
    sqlite.close();
    expect(row.sent_to_server).toBe(0);
  });
});
