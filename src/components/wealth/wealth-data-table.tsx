"use client";

import { useMemo, useState } from "react";
import { formatINRCurrency } from "@nivra/ui";
import { IconSearch } from "./wealth-icons";
import { cn } from "@/lib/utils";

export type WealthTableColumn<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  tone?: "default" | "emerald" | "amber" | "rose";
  sticky?: boolean;
  render: (row: T, index: number) => React.ReactNode;
  /** Used for year filter search when provided */
  searchValue?: (row: T) => string;
};

/** Shared shell — MF vs FD Audit ledger look. */
export function WealthLedgerShell({
  children,
  className,
  toolbar,
}: {
  children: React.ReactNode;
  className?: string;
  toolbar?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/90 bg-white",
        className,
      )}
    >
      {toolbar}
      {children}
    </div>
  );
}

export function wealthLedgerTheadClass() {
  return "border-b border-slate-200 bg-slate-50 text-[12px] font-medium uppercase tracking-[0.1em] text-slate-500";
}

export function wealthLedgerThClass(
  align: "left" | "right" = "left",
  tone?: WealthTableColumn<unknown>["tone"],
  sticky?: boolean,
) {
  return cn(
    "px-4 py-3.5 text-[13px] font-medium",
    align === "right" ? "text-right" : "text-left",
    sticky && "sticky left-0 z-[1] bg-slate-50",
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-800"
        : tone === "rose"
          ? "text-rose-700"
          : "text-slate-600",
  );
}

export function wealthLedgerTdClass(
  align: "left" | "right" = "left",
  tone?: WealthTableColumn<unknown>["tone"],
  sticky?: boolean,
) {
  return cn(
    "px-4 py-3.5 text-[14px] tabular-nums",
    align === "right" ? "text-right" : "text-left",
    sticky && "sticky left-0 bg-inherit",
    tone === "emerald"
      ? "font-medium text-emerald-700"
      : tone === "amber"
        ? "font-medium text-amber-800"
        : tone === "rose"
          ? "font-medium text-rose-600"
          : "text-slate-700",
  );
}

export function WealthDataTable<T>({
  rows,
  columns,
  summary,
  note,
  filterPlaceholder = "Filter…",
  getRowKey,
  maxHeightClass = "max-h-[420px]",
  highlightLast = true,
  hideFilter = false,
}: {
  rows: T[];
  columns: WealthTableColumn<T>[];
  summary?: Array<{ label: string; value: string; tone?: "std" | "step" }>;
  /** Optional context line under the table (Monarch report pattern). */
  note?: React.ReactNode;
  filterPlaceholder?: string;
  getRowKey: (row: T, index: number) => string | number;
  maxHeightClass?: string;
  /** Emerald milestone row on the last filtered row (Audit ledger). */
  highlightLast?: boolean;
  hideFilter?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      columns.some((col) => {
        const raw = col.searchValue?.(row);
        return raw != null && String(raw).toLowerCase().includes(q);
      }),
    );
  }, [rows, query, columns]);

  return (
    <div className="space-y-4">
      {summary && summary.length > 0 ? (
        <div
          className={cn(
            "grid divide-slate-200 overflow-hidden rounded-2xl border border-slate-200/80 bg-white",
            summary.length >= 4
              ? "grid-cols-2 lg:grid-cols-4 lg:divide-x"
              : summary.length === 3
                ? "grid-cols-1 sm:grid-cols-3 sm:divide-x"
                : "grid-cols-2 divide-x",
          )}
        >
          {summary.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "px-5 py-4",
                summary.length >= 4 && i >= 2 && "border-t border-slate-200 lg:border-t-0",
                summary.length >= 4 && i % 2 === 1 && "border-l border-slate-200 lg:border-l-0",
              )}
            >
              <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">
                {s.label}
              </div>
              <div
                className={cn(
                  "mt-1.5 text-[22px] font-medium leading-none tracking-tight tabular-nums sm:text-[24px]",
                  s.tone === "step" ? "text-emerald-700" : "text-slate-900",
                )}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <WealthLedgerShell
        toolbar={
          hideFilter ? undefined : (
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <IconSearch className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={filterPlaceholder}
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          )
        }
      >
        <div className={cn("overflow-auto", maxHeightClass)}>
          <table className="w-full min-w-[560px] border-collapse text-left text-[13px] tabular-nums">
            <thead className={cn("sticky top-0 z-10", wealthLedgerTheadClass())}>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={wealthLedgerThClass(
                      col.align ?? "left",
                      col.tone,
                      col.sticky,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((row, i) => {
                const isLast =
                  highlightLast && i === filtered.length - 1 && filtered.length > 0;
                return (
                  <tr
                    key={getRowKey(row, i)}
                    className={cn(
                      "transition-colors",
                      isLast
                        ? "border-t border-emerald-200/80 bg-emerald-50/60 hover:bg-emerald-50"
                        : "hover:bg-slate-50/80",
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          wealthLedgerTdClass(
                            col.align ?? "left",
                            col.tone,
                            col.sticky,
                          ),
                          isLast &&
                            col.tone === "emerald" &&
                            "text-[15px] font-semibold text-emerald-900",
                          isLast && !col.tone && "text-[15px] font-semibold text-emerald-900",
                        )}
                      >
                        {col.render(row, i)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </WealthLedgerShell>
      {note ? (
        <p className="text-[12px] leading-relaxed text-slate-500">{note}</p>
      ) : null}
    </div>
  );
}

export function moneyCell(value: number) {
  return formatINRCurrency(value);
}
