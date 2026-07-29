const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  available: "Disponible",
  inactive: "Inactivo",
  archived: "Archivado",
  consumed: "Consumida",
  approved: "Aprobado",
  cancelled: "Cancelado",
  completed: "Completado",
  delivered: "Entregado",
  disputed: "En disputa",
  draft: "Borrador",
  ended: "Finalizada",
  expired: "Vencido",
  failed: "Fallido",
  low_stock: "Stock bajo",
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
  release: "Liberación",
  released: "Liberada",
  reservation: "Reserva",
  restock: "Entrada",
  return: "Devolución",
  rejected: "Rechazado",
  scheduled: "Programado",
  shipped: "Enviado",
  suspended: "Suspendido",
  unpaid: "Sin pagar",
  out_of_stock: "Agotado",
  manual_adjustment: "Ajuste manual",
  sale: "Venta",
  country: "País",
  department: "Departamento",
  city: "Ciudad",
  neighborhood: "Barrio",
  mercado_pago: "Mercado Pago",
  cash_on_delivery: "Pago contraentrega",
  shipping_advance_transfer: "Anticipo por transferencia",
  transfer_full: "Transferencia total",
  PageView: "Visita",
  ViewContent: "Vista de producto",
  AddToCart: "Producto agregado",
  InitiateCheckout: "Inicio del pago",
  Purchase: "Compra confirmada",
};

export function adminStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function adminStatusTone(status: string) {
  if (["active", "approved", "available", "completed", "delivered", "paid", "published", "restock", "return"].includes(status)) {
    return "success";
  }
  if (["cancelled", "disputed", "failed", "out_of_stock", "rejected", "suspended"].includes(status)) {
    return "danger";
  }
  if (["low_stock", "pending", "processing", "scheduled", "in_process", "partially_paid", "reservation"].includes(status)) {
    return "warning";
  }
  return "neutral";
}
