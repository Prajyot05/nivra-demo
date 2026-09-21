"use client";

import { useMemo, useState } from "react";
import { formatINRCurrency } from "@nivra/ui";
import { IconSearch } from "./wealth-icons";
import { cn } from "@/lib/utils";
import {
  WealthLedgerShell,
  wealthLedgerTdClass,
  wealthLedgerThClass,
  wealthLedgerTheadClass,
} from "./wealth-data-table";

export type ScheduleRow = {
  year: number;
  stdMonthly: number;
  stdYearEnd: number;
  stepMonthly: number;
  stepYearEnd: number;
};

export function WealthScheduleTable({
  rows,
  summary,
}: {
  rows: ScheduleRow[];
  summary: Array<{ label: string; value: string; tone?: "std" | "step" }>;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;
    return rows.filter((r) => String(r.year).includes(q));
  }, [rows, query]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 divide-slate-200 overflow-hidden rounded-2xl border border-slate-200/80 bg-white lg:grid-cols-4 lg:divide-x">
        {summary.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "px-5 py-4",
              i >= 2 && "border-t border-slate-200 lg:border-t-0",
              i % 2 === 1 && "border-l border-slate-200 lg:border-l-0",
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

      <WealthLedgerShell
        toolbar={
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <IconSearch className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by year…"
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        }
      >
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13px] tabular-nums">
            <thead className={cn("sticky top-0 z-10", wealthLedgerTheadClass())}>
              <tr>
                <th className={wealthLedgerThClass("left", undefined, true)}>Year</th>
                <th className={wealthLedgerThClass("right")}>Std SIP</th>
                <th className={wealthLedgerThClass("right")}>Std Corpus</th>
                <th className={wealthLedgerThClass("right", "emerald")}>Step-Up SIP</th>
                <th className={wealthLedgerThClass("right", "emerald")}>
                  Step-Up Corpus
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((row, i) => {
                const isLast = i === filtered.length - 1 && filtered.length > 0;
                return (
                  <tr
                    key={row.year}
                    className={cn(
                      "transition-colors",
                      isLast
                        ? "border-t border-emerald-200/80 bg-emerald-50/60 hover:bg-emerald-50"
                        : "hover:bg-slate-50/80",
                    )}
                  >
                    <td
                      className={cn(
                        wealthLedgerTdClass("left", undefined, true),
                        isLast && "font-semibold text-emerald-900",
                      )}
                    >
                      {row.year}
                    </td>
                    <td className={wealthLedgerTdClass("right")}>
                      {formatINRCurrency(row.stdMonthly)}
                    </td>
                    <td
                      className={cn(
                        wealthLedgerTdClass("right"),
                        isLast && "font-semibold text-emerald-900",
                      )}
                    >
                      {formatINRCurrency(row.stdYearEnd)}
                    </td>
                    <td className={wealthLedgerTdClass("right", "emerald")}>
                      {formatINRCurrency(row.stepMonthly)}
                    </td>
                    <td
                      className={cn(
                        wealthLedgerTdClass("right", "emerald"),
                        isLast && "text-[15px] font-semibold text-emerald-900",
                      )}
                    >
                      {formatINRCurrency(row.stepYearEnd)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </WealthLedgerShell>
    </div>
  );
}
