import { z } from "zod";
import { logger } from "@/modules/observability/logger";
import { enforceRateLimit, RateLimitError } from "@/modules/security/rate-limit";

const metricSchema = z.object({
  id: z.string().max(120),
  name: z.enum(["TTFB", "FCP", "LCP", "FID", "CLS", "INP"]),
  value: z.number().finite(),
  rating: z.enum(["good", "needs-improvement", "poor"]),
  navigationType: z.string().max(40),
});

export async function POST(request: Request) {
  try {
    await enforceRateLimit("web_vitals", 60, 60);
    const parsed = metricSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
    logger.info("web_vital.measured", parsed.data);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return Response.json(
        { ok: false },
        { status: 429, headers: { "retry-after": String(error.retryAfterSeconds) } },
      );
    }
    return Response.json({ ok: false }, { status: 400 });
  }
}
