"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_GROUPS } from "@/lib/admin-nav";
import { siteConfig } from "@/lib/site-config";

export function AdminSidebar({
  className,
  open = false,
  collapsed = false,
  onNavigate,
}: {
  className?: string;
  open?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 flex h-dvh w-72 shrink-0 -translate-x-full flex-col border-r border-border bg-surface-raised shadow-lg transition-[width,transform] duration-base lg:sticky lg:top-0 lg:z-20 lg:translate-x-0 lg:shadow-none", collapsed ? "lg:w-20" : "lg:w-64", open && "translate-x-0", className)}>
      <div className={cn("flex h-16 items-center border-b border-border px-5", collapsed && "lg:justify-center lg:px-2")}>
        <Link href="/admin" onClick={onNavigate} className="font-display text-lg font-semibold text-text" title={siteConfig.brandName}>
          <span className={cn(collapsed && "lg:hidden")}>{siteConfig.brandName}</span>
          <span className={cn("ml-2 text-xs font-normal text-text-subtle", collapsed && "lg:hidden")}>Panel</span>
          <span className={cn("hidden", collapsed && "lg:inline")}>SP</span>
        </Link>
      </div>
      <nav className={cn("flex-1 overflow-y-auto px-3 py-4", collapsed && "lg:px-2")} aria-label="Navegación del panel">
        {ADMIN_NAV_GROUPS.map((group) => <div key={group.title} className="mb-5"><p className={cn("px-2 text-xs font-semibold uppercase tracking-wide text-text-subtle", collapsed && "lg:sr-only")}>{group.title}</p><ul className="mt-1.5 flex flex-col gap-0.5">{group.items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return <li key={item.href}><Link href={item.href} onClick={onNavigate} aria-current={isActive ? "page" : undefined} title={collapsed ? item.label : undefined} className={cn("flex min-h-10 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-text-muted transition-colors duration-fast hover:bg-surface-sunken hover:text-text", collapsed && "lg:justify-center lg:px-2", isActive && "bg-brand-soft text-brand hover:bg-brand-soft")}><Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span className={cn(collapsed && "lg:sr-only")}>{item.label}</span></Link></li>;
        })}</ul></div>)}
      </nav>
    </aside>
  );
}
