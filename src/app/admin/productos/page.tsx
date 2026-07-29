import type { Metadata } from "next";
import { Package } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Productos" };

export default function AdminProductsPage() {
  return (
    <AdminModulePlaceholder
      title="Productos"
      description="Ficha de producto, carga masiva por nombres separados por comas e importación CSV."
      icon={Package}
      phase={3}
      plannedFields={[
        "Precio, precio promocional, SKU, stock y estado (borrador/activo/archivado)",
        "Carga masiva pegando nombres separados por comas, con tarjetas de borrador editables",
        "Importación y exportación CSV con vista previa y validación por fila",
        "Medios: carga múltiple, reordenamiento y texto alternativo",
        "Relacionados, accesorios sugeridos y reglas de upsell",
      ]}
    />
  );
}
