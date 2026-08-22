"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, PanelLeftClose } from "lucide-react";
import { useCallback, type ReactNode } from "react";
import { NavOverlay } from "@/components/layout/nav-overlay";
import { SidebarProvider, useSidebar } from "@/components/layout/sidebar-context";
import { Button } from "@/components/ui/button";
import { getEnabledCalculators } from "@/lib/calculator-nav";
import { cn } from "@/lib/utils";

function NavLinks({
  pathname,
  items,
  variant,
}: {
  pathname: string;
  items: ReturnType<typeof getEnabledCalculators>;
  variant: "sidebar" | "mobile";
}) {
  if (variant === "mobile") {
    return (
      <>
        {items.map((item) => (
          <Link
            key={item.to}
            href={item.to}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs",
              pathname === item.to
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </>
    );
  }

  return (
    <>
      {items.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            href={item.to}
            className={cn(
              "rounded-md px-3 py-2 text-sm",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const enabledCalculators = getEnabledCalculators();
  const { collapsed, hydrated, overlayOpen, collapse, expand, closeOverlay } = useSidebar();

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    closeOverlay();
    router.replace("/login");
    router.refresh();
  }, [router, closeOverlay]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const showSidebar = hydrated && !collapsed;

  return (
    <div className="flex min-h-dvh bg-background">
      {showSidebar ? (
        <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
          <div className="flex items-start justify-between border-b border-sidebar-border px-4 py-4">
            <div>
              <div className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                Nivra Calculators
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={collapse}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose />
            </Button>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
            <NavLinks pathname={pathname} items={enabledCalculators} variant="sidebar" />
          </nav>
          <div className="border-t border-sidebar-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut />
              Sign out
            </Button>
          </div>
        </aside>
      ) : null}

      <NavOverlay
        open={overlayOpen}
        onClose={closeOverlay}
        items={enabledCalculators}
        onExpandSidebar={expand}
        onLogout={handleLogout}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex gap-2 overflow-x-auto border-b border-border px-2 py-2 md:hidden">
          <NavLinks pathname={pathname} items={enabledCalculators} variant="mobile" />
        </div>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  );
}
