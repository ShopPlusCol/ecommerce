import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { customers } from "@/infrastructure/db/schema";

export default async function Page() {
  await requirePermission("customers", "read");
  const rows = await (await getRuntimeDb()).select().from(customers);
  return <AdminRecordList title="Clientes" description="Perfiles, segmentación, notas y bloqueos persistentes." columns={["Nombre", "Teléfono", "Correo", "Último pedido"]} rows={rows.map((row) => ({ id: row.id, href: `/admin/clientes/${row.id}`, values: [row.fullName, row.phone, row.email, row.lastOrderAt?.toLocaleDateString("es-CO")] }))} />;
}
