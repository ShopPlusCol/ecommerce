import { redirect } from "next/navigation";
import { getAdminSession } from "@/modules/auth/session";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">ShopPlusCol</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-text">Acceso administrativo</h1>
        <p className="mt-2 text-sm text-text-muted">Usa las credenciales privadas asignadas a tu cuenta.</p>
        <LoginForm />
      </section>
    </main>
  );
}
