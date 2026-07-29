import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { requestRateLimits } from "@/infrastructure/db/schema";

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Demasiados intentos. Espera un momento antes de continuar.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function hashIdentifier(value: string) {
  const bytes = new TextEncoder().encode(`shoppluscol-rate-limit:v1:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function enforceRateLimit(scope: string, limit: number, windowSeconds: number) {
  const requestHeaders = await headers();
  const address =
    requestHeaders.get("cf-connecting-ip") ??
    requestHeaders.get("x-real-ip") ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  const key = `${scope}:${await hashIdentifier(address)}`;
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  const db = await getRuntimeDb();
  const [row] = await db
    .insert(requestRateLimits)
    .values({ key, scope, count: 1, resetAt, updatedAt: now })
    .onConflictDoUpdate({
      target: requestRateLimits.key,
      set: {
        count: sql`case when ${requestRateLimits.resetAt} <= ${now.getTime()} then 1 else ${requestRateLimits.count} + 1 end`,
        resetAt: sql`case when ${requestRateLimits.resetAt} <= ${now.getTime()} then ${resetAt.getTime()} else ${requestRateLimits.resetAt} end`,
        updatedAt: now,
      },
    })
    .returning();
  if (row.count > limit) {
    throw new RateLimitError(Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000)));
  }
}
