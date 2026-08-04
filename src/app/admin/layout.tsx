import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/modules/auth/session";
import { AdminEnvironmentBanner } from "@/components/admin/admin-environment-banner";
import { resolveEnvironment } from "@/modules/settings/environment";

export const metadata: Metadata = {
  title: {
    default: "Panel administrativo",
    template: "%s | Panel ShopPlusCol",
  },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  const environment = resolveEnvironment(process.env);
  return (
    <>
      <AdminEnvironmentBanner info={environment} />
      <AdminShell name={session.user.name}>{children}</AdminShell>
    </>
  );
}
