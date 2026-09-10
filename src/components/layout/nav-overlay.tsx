"use client";

import { usePathname } from "next/navigation";
import { PanelLeft, X } from "lucide-react";
import { useEffect } from "react";
import { NivraMark, PoweredByNivra } from "@/components/admin/branding";
import { CalculatorNavRow } from "@/components/layout/calculator-nav-row";
import { isNavItemActive, type NavCategory } from "@/lib/calculator-nav";
import { Button } from "@/components/ui/button";

type NavOverlayProps = {
  open: boolean;
  onClose: () => void;
  categories: NavCategory[];
  mode: string | null;
  onExpandSidebar: () => void;
  onLogout: () => void;
  showQaChecklist?: boolean;
  checked?: Record<string, boolean>;
  onToggle?: (id: string) => void;
};

export function NavOverlay({
  open,
  onClose,
  categories,
  mode,
  onExpandSidebar,
  onLogout,
  showQaChecklist = false,
  checked = {},
  onToggle,
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
      <aside className="relative flex h-full w-80 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
          <div>
            <NivraMark />
            <p className="mt-0.5 text-[11px] text-muted-foreground">Navigation</p>
            {showQaChecklist ? (
              <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                Excel QA checklist (dev)
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col overflow-y-auto p-2">
          {categories.map((category) => (
            <div key={category.id} className="mb-3">
              <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                      onToggle={onToggle ? () => onToggle(item.id) : undefined}
                      onNavigate={onClose}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="flex flex-col gap-2 border-t border-sidebar-border p-3">
          <Button variant="outline" size="sm" onClick={onExpandSidebar} className="justify-start">
            <PanelLeft />
            Pin sidebar
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout} className="justify-start">
            Sign out
          </Button>
          <PoweredByNivra />
        </div>
      </aside>
    </div>
  );
}
