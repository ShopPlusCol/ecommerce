import { adminStatusLabel, adminStatusTone } from "@/modules/admin/status-labels";
import { cn } from "@/lib/utils";

export function AdminStatusBadge({ status }: { status: string }) {
  const tone = adminStatusTone(status);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "success" && "bg-success-soft text-success",
        tone === "danger" && "bg-danger-soft text-danger",
        tone === "warning" && "bg-warning-soft text-warning",
        tone === "neutral" && "bg-surface-sunken text-text-muted",
      )}
    >
      {adminStatusLabel(status)}
    </span>
  );
}
