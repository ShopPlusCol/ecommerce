import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Pagos" };

export default function AdminPaymentsPage() {
  return (
    <AdminModulePlaceholder
      title="Pagos"
      description="Mercado Pago, transferencias manuales y pagos parciales."
      icon={Wallet}
      plannedFields={[
        "Estado de Mercado Pago (pruebas/producción) sin exponer credenciales",
        "Verificación manual de transferencias con auditoría",
        "Monto total, anticipo, pagado y saldo contraentrega por pedido",
        "Reembolsos parciales y ajustes administrativos auditados",
      ]}
    />
  );
}
