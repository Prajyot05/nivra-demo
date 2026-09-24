"use client";

import { cn } from "@/lib/utils";
import {
  WealthLedgerShell,
  wealthLedgerTheadClass,
} from "./wealth-data-table";

export type WealthAuditStat = {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "emerald";
};

export type WealthAuditCell = {
  text: string;
  tone?: "default" | "emerald" | "rose" | "muted" | "pill";
};

export type WealthAuditRow = {
  label: string;
  cells: WealthAuditCell[];
  highlight?: boolean;
  tax?: boolean;
};

/**
 * MF vs FD Audit ledger chrome — summary cards + metric table.
 * Use on growth SIP / Step-up / Lumpsum / Periodic and compare audits.
 */
export function WealthAuditLedger({
  stats,
  chips,
  columns,
  rows,
  tableTitle,
  tableSubtitle,
  note,
  className,
}: {
  stats?: WealthAuditStat[];
  chips?: React.ReactNode;
  columns: string[];
  rows: WealthAuditRow[];
  /** Heading above the Metric / Amount table. */
  tableTitle?: string;
  tableSubtitle?: string;
  note?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-5", className)}>
      {stats && stats.length > 0 ? (
        <div
          className={cn(
            "grid grid-cols-1 gap-3",
            stats.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
          )}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "rounded-2xl border p-4",
                stat.tone === "emerald"
                  ? "border-emerald-200/70 bg-emerald-50/50"
                  : "border-slate-200/80 bg-slate-50/80",
              )}
            >
              <div
                className={cn(
                  "text-[12px] font-medium uppercase tracking-[0.12em]",
                  stat.tone === "emerald"
                    ? "text-emerald-700/70"
                    : "text-slate-400",
                )}
              >
                {stat.label}
              </div>
              <div
                className={cn(
                  "mt-1.5 text-[22px] font-medium tracking-tight tabular-nums sm:text-[24px]",
                  stat.tone === "emerald" ? "text-emerald-900" : "text-slate-900",
                )}
              >
                {stat.value}
              </div>
              {stat.hint ? (
                <p
                  className={cn(
                    "mt-1.5 text-[13px] leading-snug",
                    stat.tone === "emerald"
                      ? "text-emerald-800/80"
                      : "text-slate-500",
                  )}
                >
                  {stat.hint}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {chips ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{chips}</div> : null}

      <div className="space-y-2.5">
        {tableTitle ? (
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">
              {tableTitle}
            </div>
            {tableSubtitle ? (
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                {tableSubtitle}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <WealthLedgerShell className="min-w-[28rem]">
            <table className="w-full border-collapse text-left text-[13px] tabular-nums">
              <thead>
                <tr className={wealthLedgerTheadClass()}>
                  {columns.map((col, i) => (
                    <th
                      key={col}
                      className={cn(
                        "px-4 py-3.5 text-[13px] font-medium",
                        i === 0 ? "text-left text-slate-600" : "text-right",
                        i > 0 && (i === 1 || i === columns.length - 1)
                          ? "text-emerald-700"
                          : i > 0
                            ? "text-slate-600"
                            : undefined,
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {rows.map((row) => {
                  if (row.highlight) {
                    return (
                      <tr
                        key={row.label}
                        className="border-t border-emerald-200/80 bg-emerald-50/60 transition-colors hover:bg-emerald-50"
                      >
                        <td className="px-4 py-3.5 text-[14px]">
                          <span className="inline-flex items-center rounded-md bg-emerald-600 px-2 py-0.5 text-[12px] font-semibold text-white">
                            {row.label}
                          </span>
                        </td>
                        {row.cells.map((cell, i) => (
                          <td
                            key={`${row.label}-${i}`}
                            className="px-4 py-3.5 text-right tabular-nums"
                          >
                            {cell.tone === "pill" ? (
                              <span className="rounded-md bg-emerald-600 px-2.5 py-1 text-[13px] font-semibold tracking-tight text-white">
                                {cell.text}
                              </span>
                            ) : (
                              <span
                                className={cn(
                                  "text-[15px] font-semibold",
                                  i === 0 || cell.tone === "emerald"
                                    ? "text-emerald-900"
                                    : "text-slate-700",
                                )}
                              >
                                {cell.text}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={row.label}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3.5 text-[14px] text-slate-700">
                        {row.label}
                      </td>
                      {row.cells.map((cell, i) => (
                        <td
                          key={`${row.label}-${i}`}
                          className={cn(
                            "px-4 py-3.5 text-right text-[14px] font-medium tabular-nums",
                            row.tax || cell.tone === "rose"
                              ? "text-rose-600"
                              : cell.tone === "emerald"
                                ? "text-emerald-700"
                                : cell.tone === "muted"
                                  ? "text-slate-500"
                                  : "text-slate-800",
                          )}
                        >
                          {cell.text}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </WealthLedgerShell>
        </div>
      </div>

      {note ? (
        <p className="text-[13px] leading-relaxed text-slate-500">{note}</p>
      ) : null}
    </div>
  );
}

export function WealthAuditChip({
  label,
  children,
  tone = "neutral",
}: {
  label: string;
  children: React.ReactNode;
  tone?: "neutral" | "emerald" | "rose";
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5">
      <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 text-[16px] font-medium tracking-tight tabular-nums sm:text-[17px]",
          tone === "emerald"
            ? "text-emerald-700"
            : tone === "rose"
              ? "text-rose-600"
              : "text-slate-900",
        )}
      >
        {children}
      </div>
    </div>
  );
}
