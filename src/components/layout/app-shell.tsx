"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LogOut, PanelLeftClose } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CalculatorNavRow } from "@/components/layout/calculator-nav-row";
import { NavOverlay } from "@/components/layout/nav-overlay";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";
import { NivraMark, PoweredByNivra } from "@/components/admin/branding";
import { Button } from "@/components/ui/button";
import { useAuthProfile, useSignOut } from "@/hooks/use-auth-profile";
import { useCalculatorQaChecklist } from "@/hooks/use-calculator-qa-checklist";
import {
  getVisibleCalculators,
  getVisibleCategories,
  hrefFor,
  isNavItemActive,
  type NavItem,
} from "@/lib/calculator-nav";
import { cn } from "@/lib/utils";

function NavLinks({
  pathname,
  mode,
  items,
  categories,
  variant,
  checked,
  onToggle,
  showQaChecklist,
}: {
  pathname: string;
  mode: string | null;
  items: NavItem[];
  categories: ReturnType<typeof getVisibleCategories>;
  variant: "sidebar" | "mobile";
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
  showQaChecklist: boolean;
}) {
  if (variant === "mobile") {
    return (
      <>
        {items.map((item) => {
          const active = isNavItemActive(item, pathname, mode);
          const done = item.uiPolished === true || checked[item.id];
          return (
            <Link
              key={item.id}
              href={hrefFor(item)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs",
                active
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-600",
                showQaChecklist && done && !active && "ring-1 ring-emerald-500/30",
              )}
              title={item.description}
            >
              {showQaChecklist && done ? "✓ " : ""}
              {item.shortLabel}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      {categories.map((category) => (
        <div key={category.id} className="mb-5">
          <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {category.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {category.items.map((item) => {
              const active = isNavItemActive(item, pathname, mode);
              return (
                <CalculatorNavRow
                  key={item.id}
                  item={item}
                  active={active}
                  showQaChecklist={showQaChecklist}
                  checked={checked[item.id]}
                  onToggle={() => onToggle(item.id)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const { profileId } = useAuthProfile();
  const signOut = useSignOut();
  const navProfile = profileId ?? "client";
  const enabledCalculators = useMemo(
    () => getVisibleCalculators(navProfile),
    [navProfile],
  );
  const enabledCategories = useMemo(
    () => getVisibleCategories(navProfile),
    [navProfile],
  );
  const showQaChecklist = profileId === "dev";
  const { collapsed, overlayOpen, collapse, expand, closeOverlay } = useSidebar();
  const { checked, toggle, clearAll } = useCalculatorQaChecklist();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  const handleLogout = useCallback(async () => {
    closeOverlay();
    await signOut();
  }, [signOut, closeOverlay]);

  if (
    pathname === "/login" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/company")
  ) {
    return <>{children}</>;
  }

  const showSidebar = !ready || !collapsed;
  const polishedCount = enabledCalculators.filter(
    (item) => item.uiPolished === true || checked[item.id],
  ).length;
  const totalCount = enabledCalculators.length;
  const openForPrajyot = enabledCalculators.filter(
    (item) => item.uiPolished !== true && !checked[item.id],
  ).length;

  return (
    <div className="flex min-h-dvh bg-slate-50">
      <aside
        className={cn(
          "shrink-0 border-r border-slate-200/80 bg-white",
          "hidden md:flex md:flex-col",
          showSidebar ? "w-[17.5rem]" : "md:hidden",
        )}
        aria-hidden={!showSidebar}
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 px-4 py-4">
          <div className="min-w-0">
            <NivraMark />
            <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
              Advisor calculators
            </p>
            {showQaChecklist ? (
              <p className="mt-1 text-[10px] font-medium text-slate-400">
                UI polish · {polishedCount}/{totalCount}
                {openForPrajyot > 0 ? ` · ${openForPrajyot} open` : ""}
              </p>
            ) : (
              <p className="mt-1 text-[10px] font-medium text-slate-400">
                {totalCount} tools in suite
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-slate-500"
            onClick={collapse}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-3">
          <NavLinks
            pathname={pathname}
            mode={mode}
            items={enabledCalculators}
            categories={enabledCategories}
            variant="sidebar"
            checked={checked}
            onToggle={toggle}
            showQaChecklist={showQaChecklist}
          />
        </nav>
        <div className="space-y-1.5 border-t border-slate-200/80 p-3">
          {showQaChecklist ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-500"
              onClick={clearAll}
            >
              Clear extra UI ticks
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-600"
            onClick={handleLogout}
          >
            <LogOut />
            Sign out
          </Button>
          <PoweredByNivra />
        </div>
      </aside>

      <NavOverlay
        open={overlayOpen}
        onClose={closeOverlay}
        categories={enabledCategories}
        mode={mode}
        onExpandSidebar={expand}
        onLogout={handleLogout}
        showQaChecklist={showQaChecklist}
        checked={checked}
        onToggle={toggle}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200/80 bg-white px-2 py-2 md:hidden">
          <NavLinks
            pathname={pathname}
            mode={mode}
            items={enabledCalculators}
            categories={enabledCategories}
            variant="mobile"
            checked={checked}
            onToggle={toggle}
            showQaChecklist={showQaChecklist}
          />
        </div>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <AppShellInner>{children}</AppShellInner>
      </Suspense>
    </SidebarProvider>
  );
}
