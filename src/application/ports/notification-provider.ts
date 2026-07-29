/**
 * Puerto de notificaciones desacoplado (sección 38). Si no hay proveedor
 * configurado, la implementación en infraestructura debe registrar el
 * intento sin romper el flujo del pedido.
 */
export type NotificationEvent =
  | "order_created"
  | "advance_payment_received"
  | "payment_approved"
  | "payment_rejected"
  | "order_confirmed"
  | "order_dispatched"
  | "order_delivered"
  | "order_cancelled"
  | "order_refunded"
  | "low_stock"
  | "manual_transfer_pending"
  | "password_reset";

export type NotificationPayload = {
  event: NotificationEvent;
  to: string;
  subject: string;
  data: Record<string, unknown>;
};

export interface NotificationProvider {
  readonly id: string;
  isConfigured(): boolean;
  send(payload: NotificationPayload): Promise<{ delivered: boolean; reason?: string }>;
}
