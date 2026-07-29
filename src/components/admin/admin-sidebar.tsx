"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_GROUPS } from "@/lib/admin-nav";
import { siteConfig } from "@/lib/site-config";

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface-raised",
        className,
      )}
    >
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/admin" className="font-display text-lg font-semibold text-text">
          {siteConfig.brandName}
          <span className="ml-2 text-xs font-normal text-text-subtle">Panel</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegación del panel">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">
              {group.title}
            </p>
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-text-muted transition-colors duration-fast",
                        "hover:bg-surface-sunken hover:text-text",
                        isActive && "bg-brand-soft text-brand hover:bg-brand-soft",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
