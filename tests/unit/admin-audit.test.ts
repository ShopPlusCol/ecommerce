import { describe, expect, it } from "vitest";
import { auditActionLabel, sanitizeAuditValue } from "@/modules/audit/admin-audit";

describe("auditoría segura", () => {
  it("traduce acciones conocidas", () => {
    expect(auditActionLabel("admin_user.suspend")).toBe("Suspendió un usuario");
  });

  it("oculta secretos incluso cuando están anidados", () => {
    expect(sanitizeAuditValue({ email: "qa@example.com", nested: { accessToken: "abc", password: "123" } })).toEqual({
      email: "qa@example.com",
      nested: { accessToken: "[dato protegido]", password: "[dato protegido]" },
    });
  });
});
