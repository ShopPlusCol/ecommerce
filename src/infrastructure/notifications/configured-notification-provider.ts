import nodemailer from "nodemailer";
import type { NotificationPayload, NotificationProvider } from "@/application/ports/notification-provider";

/**
 * Envío real por SMTP (sección 38). Nunca lanza: si el envío falla o no
 * está configurado, el llamador recibe `delivered: false` con el motivo y
 * decide cómo continuar — el pedido nunca depende de que el correo salga.
 *
 * Nota de despliegue: SMTP por socket crudo (lo que usa nodemailer) funciona
 * en Node/Docker, pero Cloudflare Workers no soporta sockets TCP arbitrarios
 * de forma confiable incluso con `nodejs_compat` — si el sitio se despliega
 * ahí, esto puede necesitar cambiarse por un proveedor con API HTTP (Resend,
 * Postmark, etc.) en su lugar.
 */
export class ConfiguredNotificationProvider implements NotificationProvider {
  readonly id = "smtp";

  isConfigured() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  }

  async send(payload: NotificationPayload) {
    if (!this.isConfigured()) return { delivered: false, reason: "SMTP no configurado." };
    try {
      const port = Number(process.env.SMTP_PORT ?? "587");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      });
      const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER!;
      const html = typeof payload.data.html === "string" ? payload.data.html : undefined;
      const text = typeof payload.data.text === "string" ? payload.data.text : undefined;
      await transporter.sendMail({ from, to: payload.to, subject: payload.subject, html, text });
      return { delivered: true };
    } catch (error) {
      return { delivered: false, reason: error instanceof Error ? error.message : "Error de envío SMTP." };
    }
  }
}
