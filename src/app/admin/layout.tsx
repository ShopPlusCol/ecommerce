import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/modules/auth/session";

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
  return <AdminShell name={session.user.name}>{children}</AdminShell>;
}
