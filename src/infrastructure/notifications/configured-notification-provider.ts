import type { NotificationPayload, NotificationProvider } from "@/application/ports/notification-provider";

export class ConfiguredNotificationProvider implements NotificationProvider {
  readonly id = "smtp";
  isConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  }
  async send(_payload: NotificationPayload) {
    void _payload;
    if (!this.isConfigured()) return { delivered: false, reason: "SMTP no configurado." };
    return { delivered: false, reason: "Transporte SMTP pendiente de credenciales y validación externa." };
  }
}
