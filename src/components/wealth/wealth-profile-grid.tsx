"use client";

import { cn } from "@/lib/utils";

/**
 * Trulia mortgage calculator + Midday ledger:
 * one soft panel, equal columns, fields fill their cell (not the screen).
 * Sliders stay inside the column width.
 */
export function WealthProfileGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/60 bg-white p-4 sm:p-5",
        className,
      )}
    >
      <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
        {children}
      </div>
    </div>
  );
}
