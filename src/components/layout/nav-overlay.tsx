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

  const polished = categories
    .flatMap((c) => c.items)
    .filter((i) => i.uiPolished || checked[i.id]).length;
  const total = categories.reduce((n, c) => n + c.items.length, 0);

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-stretch">
      <button
        type="button"
        aria-label="Close navigation"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-[17.5rem] max-w-[85vw] flex-col border-r border-slate-200/80 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4">
          <div>
            <NivraMark />
            <p className="mt-1.5 text-[11px] text-slate-500">Advisor calculators</p>
            {showQaChecklist ? (
              <p className="mt-1 text-[10px] font-medium text-slate-400">
                UI polish · {polished}/{total}
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-3">
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
                      onToggle={onToggle ? () => onToggle(item.id) : undefined}
                      onNavigate={onClose}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="flex flex-col gap-2 border-t border-slate-200/80 p-3">
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
