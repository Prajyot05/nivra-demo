"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calculator,
  ChartColumn,
  FileBarChart,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { NivraMark, PoweredByNivra } from "@/components/admin/branding";
import { Button } from "@/components/ui/button";
import { useAuthProfile, useSignOut } from "@/hooks/use-auth-profile";
import { cn } from "@/lib/utils";

export type AdminNavIcon =
  | "layout-dashboard"
  | "building-2"
  | "shield-check"
  | "file-bar-chart"
  | "chart-column"
  | "users"
  | "image"
  | "calculator"
  | "settings";

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
  "chart-column": ChartColumn,
  users: Users,
  image: ImageIcon,
  calculator: Calculator,
  settings: Settings,
};

function isActive(pathname: string, item: AdminNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function initialsFrom(name: string | null, email: string | null): string {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

/**
 * Admin shell — Acctual sheet-on-canvas + Fingerprint nav density.
 * Shows signed-in admin name + email in the sidebar account card.
 */
export function DashboardShell({
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
  const signOut = useSignOut();
  const { name, email, loading: authLoading } = useAuthProfile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const displayName = name || (authLoading ? "Loading…" : "Admin");
  const displayEmail = email || (authLoading ? "…" : "—");

  const brandBlock = (
    <div className="px-4 pb-4 pt-5">
      <NivraMark />
      <p className="mt-2 text-[12px] leading-snug text-[var(--admin-muted)]">
        {brandSubtitle}
      </p>
    </div>
  );

  const accountCard = (
    <div className="mx-2.5 mb-2 rounded-[var(--admin-radius-sm)] bg-white px-2.5 py-2.5 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--admin-soft)] text-[10px] font-semibold text-[var(--admin-ink)]"
          aria-hidden
        >
          {initialsFrom(name, email)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-[var(--admin-ink)]">
            {displayName}
          </p>
          <p className="truncate text-[11px] text-[var(--admin-muted)]" title={displayEmail}>
            {displayEmail}
          </p>
        </div>
      </div>
    </div>
  );

  const navLinks = (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 pb-3">
      {nav.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon ? NAV_ICONS[item.icon] : null;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-active={active ? "true" : "false"}
            className={cn(
              "admin-nav-link flex items-center gap-2.5 px-2.5 py-2 text-[13px] transition-colors",
              active ? "font-medium" : "font-normal",
            )}
          >
            {Icon ? (
              <Icon
                className={cn(
                  "admin-nav-icon h-[15px] w-[15px] shrink-0",
                  active ? undefined : "text-[var(--admin-faint)]",
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
    <div className="mt-auto space-y-1.5 pb-3 pt-2">
      {accountCard}
      <div className="space-y-1.5 px-2.5">
        {switchLink ? (
          <Link
            href={switchLink.href}
            className="flex items-center justify-between gap-2 rounded-[var(--admin-radius-sm)] bg-white px-2.5 py-2 text-[12px] font-medium text-[var(--admin-ink)] shadow-[0_0_0_1px_rgba(0,0,0,0.06)] transition-colors hover:bg-neutral-50"
          >
            <span className="truncate">{switchLink.label}</span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[var(--admin-faint)]" />
          </Link>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-[var(--admin-radius-sm)] px-2.5 py-2 text-[12px] text-[var(--admin-muted)] transition-colors hover:bg-white/70 hover:text-[var(--admin-ink)]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
        <PoweredByNivra className="pt-1" />
      </div>
    </div>
  );

  return (
    <div className="admin-shell flex min-h-dvh text-[var(--admin-ink)]">
      <aside
        className="admin-aside hidden shrink-0 md:flex md:flex-col"
        style={{ width: "var(--admin-sidebar-w)" }}
      >
        {brandBlock}
        {navLinks}
        {footerBlock}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="admin-aside relative flex h-full w-[16rem] max-w-[88vw] flex-col">
            <div className="flex items-start justify-between">
              {brandBlock}
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 mt-3"
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
        <header className="flex items-center justify-between gap-2 px-3 py-2.5 md:hidden">
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
          <div className="min-w-0 text-right">
            <p className="truncate text-[12px] font-medium">{displayName}</p>
            <p className="truncate text-[10px] text-[var(--admin-muted)]">{displayEmail}</p>
          </div>
        </header>

        <main className="admin-main flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-3 sm:p-4 lg:p-5">
          <div
            className="admin-sheet mx-auto flex w-full flex-1 flex-col"
            style={{ maxWidth: "var(--admin-content-max)" }}
          >
            <div className="flex-1 space-y-8 px-5 py-6 sm:px-7 sm:py-7 lg:px-8">
              {children}
            </div>
          </div>
          <footer className="py-3 md:hidden">
            <PoweredByNivra />
          </footer>
        </main>
      </div>
    </div>
  );
}
