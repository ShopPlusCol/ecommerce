const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  archived: "Archivado",
  approved: "Aprobado",
  cancelled: "Cancelado",
  completed: "Completado",
  delivered: "Entregado",
  disputed: "En disputa",
  draft: "Borrador",
  ended: "Finalizada",
  expired: "Vencido",
  failed: "Fallido",
  in_process: "En proceso",
  in_transit: "En tránsito",
  paid: "Pagado",
  partially_paid: "Pago parcial",
  partially_refunded: "Reembolso parcial",
  paused: "Pausado",
  pending: "Pendiente",
  processing: "En preparación",
  published: "Publicado",
  refunded: "Reembolsado",
  rejected: "Rechazado",
  scheduled: "Programado",
  shipped: "Enviado",
  suspended: "Suspendido",
  unpaid: "Sin pagar",
};

export function adminStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function adminStatusTone(status: string) {
  if (["active", "approved", "completed", "delivered", "paid", "published"].includes(status)) {
    return "success";
  }
  if (["cancelled", "disputed", "failed", "rejected", "suspended"].includes(status)) {
    return "danger";
  }
  if (["pending", "processing", "scheduled", "in_process", "partially_paid"].includes(status)) {
    return "warning";
  }
  return "neutral";
}
