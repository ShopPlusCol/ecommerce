import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { getRuntimeDb } from "@/infrastructure/db/client";
import * as schema from "@/infrastructure/db/schema";
import { ConfiguredNotificationProvider } from "@/infrastructure/notifications/configured-notification-provider";

const COOKIE_PREFIX = "shoppluscol-admin";

export async function getAuth() {
  const db = await getRuntimeDb();
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET es obligatorio en producción.");
  }

  return betterAuth({
    appName: "ShopPlusCol Admin",
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    basePath: "/api/auth",
    secret: secret ?? "solo-desarrollo-shoppluscol-cambiar-antes-de-produccion",
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
      transaction: false,
    }),
    user: {
      modelName: "adminUsers",
      fields: { name: "fullName" },
    },
    session: {
      modelName: "sessions",
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 30,
    },
    account: { modelName: "authAccounts" },
    verification: { modelName: "authVerifications" },
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        const notifications = new ConfiguredNotificationProvider();
        await notifications.send({
          event: "password_reset",
          to: user.email,
          subject: "Recupera tu acceso administrativo",
          data: {
            resetUrl: url,
            text: `Solicitaste restablecer tu contraseña administrativa. Entra a este enlace para elegir una nueva (vence pronto, si no fuiste tú ignora este correo):\n\n${url}`,
            html: `<p>Solicitaste restablecer tu contraseña administrativa.</p><p><a href="${url}">Elegir una nueva contraseña</a></p><p style="font-size:12px;color:#666;">Vence pronto. Si no fuiste tú, ignora este correo.</p>`,
          },
        });
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "authRateLimits",
      window: 60,
      max: 30,
      customRules: {
        "/sign-in/email": { window: 60, max: 8 },
        "/request-password-reset": { window: 300, max: 3 },
      },
    },
    advanced: {
      cookiePrefix: COOKIE_PREFIX,
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
    plugins: [nextCookies()],
  });
}

export { COOKIE_PREFIX };
