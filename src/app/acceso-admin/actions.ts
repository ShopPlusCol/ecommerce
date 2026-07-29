"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getAuth } from "@/modules/auth/auth";
import {
  isLoginLocked,
  nextLoginAttempt,
  normalizeIdentity,
} from "@/modules/auth/login-policy";
import { getRuntimeDb } from "@/infrastructure/db/client";
import {
  adminUsers,
  auditLogs,
  authLoginAttempts,
} from "@/infrastructure/db/schema";

export type LoginState = { error?: string };
export type ResetState = { message?: string };
const GENERIC_ERROR = "No fue posible iniciar sesión con esas credenciales.";

export async function loginAction(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = normalizeIdentity(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 12) return { error: GENERIC_ERROR };

  const db = await getRuntimeDb();
  const [attempt] = await db
    .select()
    .from(authLoginAttempts)
    .where(eq(authLoginAttempts.identityKey, email))
    .limit(1);
  if (attempt && isLoginLocked(attempt.lockedUntil)) {
    return { error: "Acceso bloqueado temporalmente. Intenta de nuevo en 15 minutos." };
  }

  try {
    const auth = await getAuth();
    await auth.api.signInEmail({
      body: { email, password, rememberMe: false },
      headers: await headers(),
    });
  } catch {
    const next = nextLoginAttempt(attempt?.failedCount ?? 0);
    await db
      .insert(authLoginAttempts)
      .values({
        identityKey: email,
        failedCount: next.failedCount,
        lockedUntil: next.lockedUntil,
        lastAttemptAt: new Date(),
      })
      .onConflictDoUpdate({
        target: authLoginAttempts.identityKey,
        set: {
          failedCount: next.failedCount,
          lockedUntil: next.lockedUntil,
          lastAttemptAt: new Date(),
          updatedAt: new Date(),
        },
      });
    return { error: GENERIC_ERROR };
  }

  const [user] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  await db.delete(authLoginAttempts).where(eq(authLoginAttempts.identityKey, email));
  if (user) {
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "login",
      entityType: "admin_user",
      entityId: user.id,
    });
  }
  redirect("/admin");
}

export async function logoutAction() {
  const auth = await getAuth();
  await auth.api.signOut({ headers: await headers() });
  redirect("/acceso-admin");
}

export async function requestPasswordResetAction(
  _state: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = normalizeIdentity(String(formData.get("resetEmail") ?? ""));
  if (email) {
    try {
      const auth = await getAuth();
      await auth.api.requestPasswordReset({
        body: { email, redirectTo: "/acceso-admin" },
        headers: await headers(),
      });
    } catch {
      // Respuesta deliberadamente idéntica para evitar enumerar usuarios.
    }
  }
  return { message: "Si la cuenta existe y SMTP está configurado, recibirás instrucciones." };
}
