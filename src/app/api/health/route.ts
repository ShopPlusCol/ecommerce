import { randomUUID } from "node:crypto";
import { getSystemStatus } from "@/modules/observability/system-status";
import { logger } from "@/modules/observability/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = randomUUID();
  try {
    const status = await getSystemStatus();
    return Response.json(
      {
        status: status.status,
        checkedAt: status.checkedAt,
        database: { status: status.database.status, latencyMs: status.database.latencyMs },
        revision: status.runtime.revision,
      },
      { headers: { "x-request-id": requestId, "cache-control": "no-store" } },
    );
  } catch (error) {
    logger.error("health.failed", {
      requestId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.json(
      { status: "unavailable", checkedAt: new Date().toISOString(), requestId },
      { status: 503, headers: { "x-request-id": requestId, "cache-control": "no-store" } },
    );
  }
}
