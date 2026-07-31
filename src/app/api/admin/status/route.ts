import { requirePermission } from "@/modules/auth/session";
import { getSystemStatus } from "@/modules/observability/system-status";

export const dynamic = "force-dynamic";

export async function GET() {
  await requirePermission("settings", "read");
  return Response.json(await getSystemStatus(), {
    headers: { "cache-control": "private, no-store" },
  });
}
