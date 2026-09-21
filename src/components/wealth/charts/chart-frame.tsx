"use client";

import { formatINRCurrency } from "@nivra/ui";
import { cn } from "@/lib/utils";

/** Shared chart chrome — Monarch / Mercury: soft surface, quiet grid. */
export function ChartFrame({
  children,
  className,
  height = "h-[320px] sm:h-[380px]",
}: {
  children: React.ReactNode;
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-slate-200/70 bg-white p-3 sm:p-4",
        height,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ChartTooltipCard({
  label,
  rows,
}: {
  label: string;
  rows: Array<{ name: string; value: number; color?: string }>;
}) {
  return (
    <div className="min-w-[160px] rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.10)]">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              {r.color ? (
                <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />
              ) : null}
              {r.name}
            </span>
            <span className="font-semibold tabular-nums text-slate-900">
              {formatINRCurrency(r.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const chartAxisTick = { fill: "#94A3B8", fontSize: 11 } as const;
export const chartGrid = { stroke: "#F1F5F9", strokeDasharray: "0", vertical: false } as const;
