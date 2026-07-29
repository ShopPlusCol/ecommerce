"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

export function AdminShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  const [navigationOpen, setNavigationOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      {navigationOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/35 lg:hidden"
          aria-label="Cerrar navegación"
          onClick={() => setNavigationOpen(false)}
        />
      ) : null}
      <AdminSidebar open={navigationOpen} onNavigate={() => setNavigationOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar name={name} onOpenNavigation={() => setNavigationOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-surface px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
