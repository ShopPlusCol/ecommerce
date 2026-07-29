import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { can } from "@/modules/auth/authorization";
import { isLoginLocked, LOGIN_LOCK_MS, nextLoginAttempt } from "@/modules/auth/login-policy";
import { validateMedia } from "@/modules/media/validation";
import { MercadoPagoProvider } from "@/infrastructure/payments/mercado-pago-provider";

describe("seguridad administrativa", () => {
  it("owner tiene acceso total y otros roles requieren permiso explícito", () => {
    expect(can(["owner"], [], "users", "delete")).toBe(true);
    expect(can(["operations"], ["orders:update"], "orders", "update")).toBe(true);
    expect(can(["read_only_analyst"], ["orders:read"], "orders", "update")).toBe(false);
  });

  it("bloquea durante 15 minutos al quinto fallo", () => {
    const now = new Date("2026-07-29T12:00:00Z");
    const result = nextLoginAttempt(4, now);
    expect(result.failedCount).toBe(5);
    expect(result.lockedUntil?.getTime()).toBe(now.getTime() + LOGIN_LOCK_MS);
    expect(isLoginLocked(result.lockedUntil, now)).toBe(true);
  });
});

describe("medios", () => {
  it("valida firma real PNG y obtiene dimensiones", () => {
    const bytes = new Uint8Array(24);
    bytes.set([0x89, 0x50, 0x4e, 0x47]);
    const view = new DataView(bytes.buffer);
    view.setUint32(16, 320);
    view.setUint32(20, 180);
    expect(validateMedia(bytes, "image/png")).toMatchObject({ width: 320, height: 180 });
  });
  it("rechaza SVG con scripts", () => {
    const body = new TextEncoder().encode("<svg><script>alert(1)</script></svg>");
    expect(() => validateMedia(body, "image/svg+xml")).toThrow(/no permitidos/);
  });
});

describe("Mercado Pago", () => {
  it("verifica el manifiesto HMAC oficial del webhook", () => {
    const secret = "webhook-test-secret";
    const dataId = "ABC123";
    const requestId = "request-1";
    const ts = "1742505638683";
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
    const signature = createHmac("sha256", secret).update(manifest).digest("hex");
    const provider = new MercadoPagoProvider("token", secret, true);
    expect(provider.verifyWebhookSignature({
      signatureHeader: `ts=${ts},v1=${signature}`,
      requestId,
      dataId,
    })).toBe(true);
  });
});
