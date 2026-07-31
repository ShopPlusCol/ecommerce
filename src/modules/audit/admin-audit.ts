const sensitiveKey = /password|token|secret|authorization|cookie|credential|access.?key/i;

const actionLabels: Record<string, string> = {
  "product.create": "Creó un producto",
  "product.status.update": "Cambió el estado de un producto",
  "inventory.adjust": "Ajustó existencias",
  "inventory.reserve.release": "Liberó una reserva",
  "order.status.update": "Cambió el estado de un pedido",
  "manual_transfer.approved": "Aprobó una transferencia",
  "manual_transfer.rejected": "Rechazó una transferencia",
  "admin_user.create": "Creó un usuario administrativo",
  "admin_user.role": "Cambió el rol de un usuario",
  "admin_user.suspend": "Suspendió un usuario",
  "admin_user.activate": "Activó un usuario",
  "admin_user.revoke_sessions": "Revocó sesiones",
  "admin_user.password": "Cambió una contraseña",
  "settings.brand.update": "Actualizó la identidad visual",
  "settings.privacy.update": "Actualizó privacidad",
  "page.publish": "Publicó una página",
  "page.version.restore": "Restauró una versión de página",
  "analytics.csv.export": "Exportó analítica",
};

export function auditActionLabel(action: string) {
  if (actionLabels[action]) return actionLabels[action];
  const words = action.replaceAll("_", " ").replaceAll(".", " · ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function sanitizeAuditValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[contenido anidado omitido]";
  if (Array.isArray(value)) return value.slice(0, 30).map((item) => sanitizeAuditValue(item, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 50).map(([key, item]) => [
      key,
      sensitiveKey.test(key) ? "[dato protegido]" : sanitizeAuditValue(item, depth + 1),
    ]));
  }
  if (typeof value === "string" && value.length > 500) return `${value.slice(0, 500)}…`;
  return value;
}

export function auditDescription(action: string, entityType: string, entityId: string) {
  return `${auditActionLabel(action)} en ${entityType} (${entityId}).`;
}
