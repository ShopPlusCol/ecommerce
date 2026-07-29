import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Chip } from "@/components/ui/chip";
import type { LucideIcon } from "lucide-react";

export function AdminModulePlaceholder({
  title,
  description,
  icon: Icon,
  plannedFields,
  phase = 3,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  plannedFields: string[];
  phase?: number;
}) {
  return (
    <>
      <AdminPageHeader title={title} description={description} />
      <EmptyState
        icon={<Icon className="h-8 w-8" />}
        title={`Módulo de ${title.toLowerCase()} pendiente de conectar`}
        description="La estructura de datos ya existe en el modelo; la interfaz completa y la persistencia se construyen en la fase indicada."
        action={<Chip variant="info">Fase {phase}</Chip>}
      />
      <div className="mt-6 rounded-lg border border-border bg-surface-raised p-5">
        <p className="text-sm font-medium text-text">Este módulo administrará:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-muted">
          {plannedFields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
