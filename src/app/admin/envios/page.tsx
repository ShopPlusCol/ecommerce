import { eq } from "drizzle-orm";
import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { shippingRules, shippingZones } from "@/infrastructure/db/schema";
export default async function Page() {
  await requirePermission("shipping", "read"); const db = await getRuntimeDb(); const rows = await db.select({ rule: shippingRules, zone: shippingZones }).from(shippingRules).innerJoin(shippingZones, eq(shippingZones.id, shippingRules.zoneId));
  return <AdminRecordList title="Envíos" description="La regla activa más específica gana." columns={["Regla", "Nivel", "Ubicación", "Tarifa", "Estado"]} rows={rows.map(({ rule, zone }) => ({ id: rule.id, values: [rule.name, zone.level, zone.neighborhood ?? zone.city ?? zone.department ?? zone.country, `$${rule.fee.toLocaleString("es-CO")}`, rule.status] }))} />;
}
