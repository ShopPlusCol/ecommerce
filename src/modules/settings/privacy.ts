import { eq } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { settings } from "@/infrastructure/db/schema";

export type PrivacySettings = {
  policyVersion: string;
  controllerName: string;
  legalId: string;
  address: string;
  privacyEmail: string;
  orderRetentionMonths: number;
  proofRetentionMonths: number;
  auditRetentionMonths: number;
  legalReviewStatus: "pending" | "reviewed";
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  policyVersion: "2026-07-29",
  controllerName: "ShopPlusCol",
  legalId: "",
  address: "",
  privacyEmail: "hola@shoppluscol.com",
  orderRetentionMonths: 60,
  proofRetentionMonths: 60,
  auditRetentionMonths: 60,
  legalReviewStatus: "pending",
};

export async function getPrivacySettings(): Promise<PrivacySettings> {
  const db = await getRuntimeDb();
  const [row] = await db.select().from(settings).where(eq(settings.key, "privacy")).limit(1);
  return { ...DEFAULT_PRIVACY_SETTINGS, ...((row?.value as Partial<PrivacySettings>) ?? {}) };
}
