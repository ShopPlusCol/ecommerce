import { AdminRecordList } from "@/components/admin/admin-record-list";
import { AdminDataResetForm } from "@/components/admin/admin-data-reset-form";
import { resetConfirmation } from "@/modules/admin/data-reset";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { customers } from "@/infrastructure/db/schema";
import { clearCustomersAction } from "../data-reset-actions";

export default async function Page() {
  const session = await requirePermission("customers", "read");
  const rows = await (await getRuntimeDb()).select().from(customers);
  return <><AdminRecordList title="Clientes" description="Perfiles, segmentación, notas y bloqueos persistentes." emptyTitle="Todavía no hay clientes." emptyDescription="Los perfiles aparecerán automáticamente cuando se registre el primer pedido." columns={["Nombre", "Teléfono", "Correo", "Último pedido"]} rows={rows.map((row) => ({ id: row.id, href: `/admin/clientes/${row.id}`, values: [row.fullName, row.phone, row.email, row.lastOrderAt?.toLocaleDateString("es-CO")] }))} />{session.roles.includes("owner") ? <AdminDataResetForm title="Limpiar todos los clientes" description="Elimina perfiles, direcciones y consentimientos asociados. Los pedidos existentes conservan su instantánea histórica sin vínculo al perfil eliminado." confirmation={resetConfirmation("customers")} action={clearCustomersAction} /> : null}</>;
}
