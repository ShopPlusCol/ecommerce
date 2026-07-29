import type { Metadata } from "next";
import { History } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Auditoría" };

export default function AdminAuditPage() {
  return (
    <AdminModulePlaceholder
      title="Auditoría"
      description="Registro de quién, qué, cuándo y por qué en acciones sensibles."
      icon={History}
      plannedFields={[
        "Cambios de precio, stock, pagos manuales y estado de pedido",
        "Reembolsos, reglas de envío, cupones y promociones",
        "Antes/después de forma segura, con identificador de correlación",
      ]}
    />
  );
}
