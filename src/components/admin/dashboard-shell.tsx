"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Calculator,
  FileBarChart,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { NivraMark, PoweredByNivra } from "@/components/admin/branding";
import { AdminLayoutPicker } from "@/components/admin/layout-picker";
import { AdminLayoutProvider, useAdminLayout } from "@/components/admin/layout-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AdminNavIcon =
  | "layout-dashboard"
  | "building-2"
  | "shield-check"
  | "file-bar-chart"
  | "users"
  | "image"
  | "calculator"
  | "settings"
  | "layout-template";

export type AdminNavItem = {
  href: string;
  label: string;
  icon?: AdminNavIcon;
  exact?: boolean;
};

const NAV_ICONS: Record<AdminNavIcon, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "building-2": Building2,
  "shield-check": ShieldCheck,
  "file-bar-chart": FileBarChart,
  users: Users,
  image: ImageIcon,
  calculator: Calculator,
  settings: Settings,
  "layout-template": LayoutTemplate,
};

function isActive(pathname: string, item: AdminNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function DashboardShellInner({
  brandSubtitle,
  nav,
  children,
  switchLink,
}: {
  brandSubtitle: string;
  nav: AdminNavItem[];
  children: ReactNode;
  switchLink?: { href: string; label: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { layoutId, layout } = useAdminLayout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }, [router]);

  useEffect(() => {
    setMobileOpen(false);
    setPickerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const navLinks = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {nav.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon ? NAV_ICONS[item.icon] : null;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-active={active ? "true" : "false"}
            className={cn(
              "admin-nav-link flex items-center gap-3 px-3 py-2 text-sm transition-colors",
              active
                ? "font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
              !active && "hover:bg-sidebar-accent/70",
            )}
          >
            {Icon ? (
              <Icon
                className={cn(
                  "admin-nav-icon h-4 w-4",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              />
            ) : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footerBlock = (
    <div className="mt-auto space-y-3 border-t border-sidebar-border p-3">
      <div className="rounded-[var(--admin-radius-sm)] border border-sidebar-border bg-sidebar-accent/40 p-2.5">
        <AdminLayoutPicker compact />
      </div>
      {switchLink ? (
        <Button variant="outline" size="sm" className="w-full justify-start" asChild>
          <Link href={switchLink.href}>{switchLink.label}</Link>
        </Button>
      ) : null}
      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
        <LogOut />
        Sign out
      </Button>
      <PoweredByNivra />
    </div>
  );

  return (
    <div
      className="admin-shell flex min-h-dvh bg-background text-foreground"
      data-admin-layout={layoutId}
      data-density={layout.density}
    >
      <aside
        className="admin-aside hidden shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col"
        style={{ width: "var(--admin-sidebar-w)" }}
      >
        <div className="border-b border-sidebar-border px-5 py-5">
          <NivraMark />
          <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">{brandSubtitle}</p>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground/70">
            Layout · {layout.name}
          </p>
        </div>
        {navLinks}
        {footerBlock}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="admin-aside relative flex h-full w-80 max-w-[88vw] flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
            <div className="flex items-start justify-between border-b border-sidebar-border px-5 py-5">
              <div>
                <NivraMark />
                <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                  {brandSubtitle}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
              >
                <X />
              </Button>
            </div>
            {navLinks}
            {footerBlock}
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 md:hidden">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </Button>
            <NivraMark />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen((open) => !open)}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            {layout.name}
          </Button>
        </header>

        {pickerOpen ? (
          <div className="border-b border-border bg-card p-3 md:hidden">
            <AdminLayoutPicker compact />
          </div>
        ) : null}

        <main className="admin-main flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-background">
          <div
            className="mx-auto w-full flex-1 space-y-6 px-4 sm:px-6 lg:px-8"
            style={{
              maxWidth: "var(--admin-content-max)",
              paddingTop: "var(--admin-main-pad)",
              paddingBottom: "var(--admin-main-pad)",
            }}
          >
            {children}
          </div>
          <footer className="border-t border-border px-4 py-3 md:hidden">
            <PoweredByNivra />
          </footer>
        </main>
      </div>
    </div>
  );
}

export function DashboardShell(props: {
  brandSubtitle: string;
  nav: AdminNavItem[];
  children: ReactNode;
  switchLink?: { href: string; label: string };
}) {
  return (
    <AdminLayoutProvider>
      <DashboardShellInner {...props} />
    </AdminLayoutProvider>
  );
}
