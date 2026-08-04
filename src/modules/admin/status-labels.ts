const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  available: "Disponible",
  inactive: "Inactivo",
  archived: "Archivado",
  consumed: "Consumida",
  approved: "Aprobado",
  cancelled: "Cancelado",
  completed: "Completado",
  confirmed: "Confirmado",
  delivered: "Entregado",
  dispatched: "Despachado",
  disputed: "En disputa",
  draft: "Borrador",
  ended: "Finalizada",
  expired: "Vencido",
  failed: "Fallido",
  incident: "Incidencia",
  in_preparation: "En preparación",
  low_stock: "Stock bajo",
  in_process: "En proceso",
  in_transit: "En tránsito",
  paid: "Pagado",
  partial_payment_required: "Pago parcial requerido",
  partially_paid: "Pago parcial",
  partially_refunded: "Reembolso parcial",
  paused: "Pausado",
  payment_in_review: "Pago en revisión",
  pending: "Pendiente",
  pending_payment: "Pendiente de pago",
  processing: "En preparación",
  published: "Publicado",
  ready_for_dispatch: "Listo para despacho",
  refunded: "Reembolsado",
  release: "Liberación",
  released: "Liberada",
  reservation: "Reserva",
  restock: "Entrada",
  return: "Devolución",
  returned: "Devuelto",
  rejected: "Rechazado",
  scheduled: "Programado",
  shipped: "Enviado",
  suspended: "Suspendido",
  unpaid: "Sin pagar",
  advance_pending: "Anticipo pendiente",
  advance_approved: "Anticipo aprobado",
  full_payment_pending: "Pago total pendiente",
  out_of_stock: "Agotado",
  manual_adjustment: "Ajuste manual",
  sale: "Venta",
  country: "País",
  department: "Departamento",
  city: "Ciudad",
  neighborhood: "Barrio",
  cart_amount: "Valor del carrito",
  item_count: "Cantidad de artículos",
  category: "Categoría",
  zone: "Zona",
  campaign: "Campaña",
  once_per_session: "Una vez por sesión",
  once_per_period: "Una vez por periodo",
  always: "Siempre",
  mercado_pago: "Mercado Pago",
  manual_transfer: "Transferencia manual",
  cash_on_delivery: "Pago contraentrega",
  shipping_advance_transfer: "Anticipo por transferencia",
  transfer_full: "Transferencia total",
  // Propósitos de pago (`payments.purpose`): salían en crudo en la ficha
  // del pedido.
  shipping_advance: "Anticipo del domicilio",
  full_payment: "Pago total",
  balance_on_delivery: "Saldo por pagar al recibir",
  // Métodos de entrega y otros códigos visibles en el panel.
  delivery: "Domicilio",
  pickup: "Recogida en tienda",
  local: "Almacenamiento local",
  r2: "Cloudflare R2",
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
  if (
    [
      "active", "approved", "available", "completed", "confirmed", "delivered", "paid",
      "published", "restock", "return", "advance_approved", "ready_for_dispatch", "dispatched",
    ].includes(status)
  ) {
    return "success";
  }
  if (
    ["cancelled", "disputed", "failed", "out_of_stock", "rejected", "suspended", "incident", "returned"].includes(status)
  ) {
    return "danger";
  }
  if (
    [
      "low_stock", "pending", "processing", "scheduled", "in_process", "in_transit", "partially_paid",
      "reservation", "pending_payment", "partial_payment_required", "payment_in_review", "in_preparation",
      "unpaid", "advance_pending", "full_payment_pending",
    ].includes(status)
  ) {
    return "warning";
  }
  return "neutral";
}
