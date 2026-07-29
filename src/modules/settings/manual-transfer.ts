import { eq } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { settings } from "@/infrastructure/db/schema";

export type ManualTransferSettings = {
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  instructions: string;
  qrUrl: string | null;
};
export const DEFAULT_MANUAL_TRANSFER: ManualTransferSettings = {
  bankName: "",
  accountType: "",
  accountNumber: "",
  accountHolder: "",
  instructions: "Realiza la transferencia y adjunta el comprobante para revisión.",
  qrUrl: null,
};
export async function getManualTransferSettings() {
  const db = await getRuntimeDb();
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "manual_transfer")).limit(1);
  return row?.value && typeof row.value === "object"
    ? { ...DEFAULT_MANUAL_TRANSFER, ...(row.value as Partial<ManualTransferSettings>) }
    : DEFAULT_MANUAL_TRANSFER;
}
