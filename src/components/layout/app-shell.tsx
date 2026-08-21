"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CALCULATOR_NAV } from "@/lib/calculator-nav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
        <div className="border-b border-sidebar-border px-4 py-4">
          <div className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Nivra Calculators
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Next.js · shared kit</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {CALCULATOR_NAV.map((item) => {
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
                <div>{item.label}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item.owner}
                  {item.ready ? " · live" : " · soon"}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex gap-2 overflow-x-auto border-b border-border px-2 py-2 md:hidden">
          {CALCULATOR_NAV.map((item) => (
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
        </div>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
