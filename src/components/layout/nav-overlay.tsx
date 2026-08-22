"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, X } from "lucide-react";
import { useEffect } from "react";
import type { NavItem } from "@/lib/calculator-nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavOverlayProps = {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  onExpandSidebar: () => void;
  onLogout: () => void;
};

export function NavOverlay({
  open,
  onClose,
  items,
  onExpandSidebar,
  onLogout,
}: NavOverlayProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-stretch">
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
          <div>
            <div className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Nivra Calculators
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Navigation</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {items.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={onClose}
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
        </nav>
        <div className="flex flex-col gap-2 border-t border-sidebar-border p-3">
          <Button variant="outline" size="sm" onClick={onExpandSidebar} className="justify-start">
            <PanelLeft />
            Pin sidebar
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout} className="justify-start">
            Sign out
          </Button>
        </div>
      </aside>
    </div>
  );
}
