"use client";

import { Check, LayoutTemplate } from "lucide-react";
import { useAdminLayout } from "@/components/admin/layout-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminLayoutId } from "@/lib/admin/layouts";

const SWATCH: Record<AdminLayoutId, { a: string; b: string; c: string }> = {
  studio: { a: "#ffffff", b: "#ffffff", c: "#0f172a" },
  harbor: { a: "#ffffff", b: "#ffffff", c: "#2563eb" },
  ledger: { a: "#ffffff", b: "#ffffff", c: "#c4a35a" },
  workbench: { a: "#ffffff", b: "#ffffff", c: "#056ee8" },
  summit: { a: "#ffffff", b: "#ffffff", c: "#0176d3" },
  command: { a: "#ffffff", b: "#ffffff", c: "#0f766e" },
};

export function AdminLayoutPicker({ compact = false }: { compact?: boolean }) {
  const { layoutId, layouts, setLayoutId } = useAdminLayout();

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <LayoutTemplate className="h-3.5 w-3.5" />
          Layout
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {layouts.map((layout) => {
            const active = layout.id === layoutId;
            const swatch = SWATCH[layout.id];
            return (
              <button
                key={layout.id}
                type="button"
                onClick={() => setLayoutId(layout.id)}
                className={cn(
                  "rounded-[var(--admin-radius-sm)] border px-2 py-2 text-left transition-colors",
                  active
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card/40 hover:bg-accent/60",
                )}
              >
                <div className="mb-1.5 flex h-3 overflow-hidden rounded-sm border border-border/60">
                  <span className="w-1/3" style={{ background: swatch.a }} />
                  <span className="w-1/3" style={{ background: swatch.b }} />
                  <span className="w-1/3" style={{ background: swatch.c }} />
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-medium leading-none">{layout.name}</span>
                  {active ? <Check className="h-3 w-3 shrink-0 text-primary" /> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {layouts.map((layout) => {
        const active = layout.id === layoutId;
        const swatch = SWATCH[layout.id];
        return (
          <button
            key={layout.id}
            type="button"
            onClick={() => setLayoutId(layout.id)}
            className={cn(
              "admin-card group relative overflow-hidden border bg-card p-4 text-left transition-all",
              active
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-foreground/20",
            )}
          >
            <div className="mb-4 flex h-16 overflow-hidden rounded-[var(--admin-radius-sm)] border border-border">
              <div className="w-[28%]" style={{ background: swatch.a }} />
              <div className="relative flex-1" style={{ background: swatch.b }}>
                <div
                  className="absolute inset-3 rounded-sm border border-black/5"
                  style={{ background: swatch.a === "#ffffff" || swatch.a === "#f6f9fc" ? "#fff" : swatch.a }}
                />
                <div
                  className="absolute bottom-3 right-3 h-2 w-8 rounded-full"
                  style={{ background: swatch.c }}
                />
              </div>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold tracking-tight">{layout.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{layout.tagline}</p>
                <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground/80">
                  {layout.inspiredBy}
                </p>
              </div>
              {active ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  <Check className="h-3 w-3" /> Active
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100"
                  tabIndex={-1}
                >
                  Use
                </Button>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
