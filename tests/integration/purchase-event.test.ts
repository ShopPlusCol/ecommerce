import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * El envío real a Meta se sustituye: lo que se prueba aquí es la bandeja de
 * salida (una compra por pedido, recuperable si Meta falla), no la API de
 * Meta.
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

function readEvent() {
  const sqlite = new Database(dbPath, { readonly: true });
  const row = sqlite
    .prepare("select event_id, delivery_status, attempts, sent_to_server, last_error_code, next_retry_at from analytics_events")
    .get() as
    | {
        event_id: string;
        delivery_status: string;
        attempts: number;
        sent_to_server: number;
        last_error_code: string | null;
        next_retry_at: number | null;
      }
    | undefined;
  sqlite.close();
  return row;
}

beforeEach(() => {
  vi.resetModules();
  sendMetaServerEvent.mockClear();
  sendMetaServerEvent.mockResolvedValue({ ok: true as const });
  tempDir = mkdtempSync(join(tmpdir(), "shoppluscol-purchase-"));
  dbPath = join(tempDir, "test.db");
  applyAllMigrations(dbPath);
  process.env.SQLITE_PATH = dbPath;
});

afterEach(() => {
  delete process.env.SQLITE_PATH;
  // El módulo cachea su conexión SQLite; en Windows eso impide borrar el
  // archivo. La limpieza es best-effort y no debe hacer fallar la prueba.
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Ignorar.
  }
});

async function subject() {
  return import("@/modules/analytics/purchase-event");
}

const baseInput = {
  orderId: "order-1",
  value: 58000,
  eventSourceUrl: "https://tienda.test/checkout/confirmacion",
  email: "clienta@example.com",
  phone: "3001234567",
  marketingConsent: true,
};

describe("bandeja de salida del evento Purchase", () => {
  it("envía la compra y la marca como entregada", async () => {
    const { emitPurchaseEventOnce } = await subject();

    expect(await emitPurchaseEventOnce(baseInput)).toEqual({ status: "sent" });
    expect(sendMetaServerEvent).toHaveBeenCalledTimes(1);

    const row = readEvent();
    expect(row?.event_id).toBe("purchase:order-1");
    expect(row?.delivery_status).toBe("sent");
    expect(row?.sent_to_server).toBe(1);
    expect(row?.next_retry_at).toBeNull();
  });

  it("no reenvía una compra ya entregada, aunque se recargue la confirmación", async () => {
    const { emitPurchaseEventOnce } = await subject();
    await emitPurchaseEventOnce(baseInput);

    expect(await emitPurchaseEventOnce(baseInput)).toEqual({ status: "already_sent" });
    expect(await emitPurchaseEventOnce(baseInput)).toEqual({ status: "already_sent" });
    expect(sendMetaServerEvent).toHaveBeenCalledTimes(1);
  });

  it("conserva la compra cuando Meta falla, en vez de perderla", async () => {
    sendMetaServerEvent.mockResolvedValueOnce({ ok: false, error: "Meta CAPI respondió 500" } as never);
    const { emitPurchaseEventOnce } = await subject();

    const result = await emitPurchaseEventOnce(baseInput);
    expect(result.status).toBe("failed");

    const row = readEvent();
    expect(row?.delivery_status).toBe("failed");
    expect(row?.sent_to_server).toBe(0);
    expect(row?.last_error_code).toBe("Meta CAPI respondió 500");
    // Queda programada para reintento, no descartada.
    expect(row?.next_retry_at).not.toBeNull();
  });

  it("reintenta con éxito una compra que había fallado", async () => {
    sendMetaServerEvent.mockResolvedValueOnce({ ok: false, error: "Meta CAPI respondió 503" } as never);
    const { emitPurchaseEventOnce } = await subject();
    const now = new Date("2026-08-04T12:00:00Z");

    await emitPurchaseEventOnce(baseInput, now);
    expect(readEvent()?.delivery_status).toBe("failed");

    // Este era el bug: antes bastaba con que la fila existiera para darla
    // por despachada, así que el reintento nunca volvía a enviar.
    const later = new Date(now.getTime() + 10 * 60_000);
    expect(await emitPurchaseEventOnce(baseInput, later)).toEqual({ status: "sent" });

    const row = readEvent();
    expect(row?.delivery_status).toBe("sent");
    expect(row?.attempts).toBe(2);
    expect(row?.last_error_code).toBeNull();
    expect(sendMetaServerEvent).toHaveBeenCalledTimes(2);
  });

  it("no reintenta antes de que venza la espera", async () => {
    sendMetaServerEvent.mockResolvedValueOnce({ ok: false, error: "Meta CAPI respondió 500" } as never);
    const { emitPurchaseEventOnce } = await subject();
    const now = new Date("2026-08-04T12:00:00Z");

    await emitPurchaseEventOnce(baseInput, now);
    const tooSoon = new Date(now.getTime() + 5_000);
    expect(await emitPurchaseEventOnce(baseInput, tooSoon)).toEqual({ status: "claimed_elsewhere" });
    expect(sendMetaServerEvent).toHaveBeenCalledTimes(1);
  });

  it("dos webhooks concurrentes no duplican la compra", async () => {
    const { emitPurchaseEventOnce } = await subject();
    const now = new Date("2026-08-04T12:00:00Z");

    const [a, b] = await Promise.all([
      emitPurchaseEventOnce(baseInput, now),
      emitPurchaseEventOnce(baseInput, now),
    ]);

    const outcomes = [a.status, b.status].sort();
    // Uno envía; el otro se retira porque el reintento aún no vence.
    expect(outcomes).toEqual(["claimed_elsewhere", "sent"]);
    expect(sendMetaServerEvent).toHaveBeenCalledTimes(1);
  });

  it("no envía nada sin consentimiento de marketing, ni deja rastro", async () => {
    const { emitPurchaseEventOnce } = await subject();

    expect(await emitPurchaseEventOnce({ ...baseInput, marketingConsent: false })).toEqual({ status: "no_consent" });
    expect(sendMetaServerEvent).not.toHaveBeenCalled();
    expect(readEvent()).toBeUndefined();
  });

  it("dos compras distintas se reportan por separado", async () => {
    const { emitPurchaseEventOnce } = await subject();
    await emitPurchaseEventOnce(baseInput);
    await emitPurchaseEventOnce({ ...baseInput, orderId: "order-2" });
    expect(sendMetaServerEvent).toHaveBeenCalledTimes(2);
  });
});

describe("recuperación de compras pendientes", () => {
  it("recupera las vencidas y no toca las ya entregadas", async () => {
    sendMetaServerEvent.mockResolvedValueOnce({ ok: false, error: "Meta CAPI respondió 500" } as never);
    const { emitPurchaseEventOnce, recoverPendingPurchaseEvents } = await subject();
    const now = new Date("2026-08-04T12:00:00Z");

    await emitPurchaseEventOnce(baseInput, now); // falla → pending/failed
    await emitPurchaseEventOnce({ ...baseInput, orderId: "order-2" }, now); // se entrega
    expect(sendMetaServerEvent).toHaveBeenCalledTimes(2);

    const later = new Date(now.getTime() + 10 * 60_000);
    const summary = await recoverPendingPurchaseEvents({ now: later });

    expect(summary).toEqual({ considered: 1, sent: 1, failed: 0 });
    // Solo se reintentó la fallida; la entregada no se volvió a enviar.
    expect(sendMetaServerEvent).toHaveBeenCalledTimes(3);
  });

  it("no reintenta nada si todavía no vencieron", async () => {
    sendMetaServerEvent.mockResolvedValueOnce({ ok: false, error: "Meta CAPI respondió 500" } as never);
    const { emitPurchaseEventOnce, recoverPendingPurchaseEvents } = await subject();
    const now = new Date("2026-08-04T12:00:00Z");

    await emitPurchaseEventOnce(baseInput, now);
    const summary = await recoverPendingPurchaseEvents({ now: new Date(now.getTime() + 1_000) });
    expect(summary).toEqual({ considered: 0, sent: 0, failed: 0 });
  });
});
