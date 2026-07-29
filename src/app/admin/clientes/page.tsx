import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { customers } from "@/infrastructure/db/schema";
export default async function Page() {
  await requirePermission("customers", "read"); const rows = await (await getRuntimeDb()).select().from(customers);
  return <AdminRecordList title="Clientes" description="Clientes generados por pedidos, sin métricas inventadas." columns={["Nombre", "Teléfono", "Correo", "Último pedido"]} rows={rows.map((r) => ({ id: r.id, values: [r.fullName, r.phone, r.email, r.lastOrderAt?.toLocaleDateString("es-CO")] }))} />;
}
