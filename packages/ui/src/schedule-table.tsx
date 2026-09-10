import type { ReactNode } from "react";
import { formatINRCurrency } from "./format";

export type ScheduleColumnTone = "default" | "std" | "step" | "warn";

export type ScheduleColumn<T> = {
  key: keyof T | string;
  header: string;
  align?: "left" | "right";
  format?: "inr" | "text" | "number";
  /** Column chrome like Goal SIP schedule (blue / green / amber bands). */
  tone?: ScheduleColumnTone;
  /** Pin this column on the left while the table scrolls horizontally. */
  sticky?: boolean;
  /** Custom cell content (e.g. status badges). Overrides format when set. */
  render?: (value: unknown, row: T, index: number) => ReactNode;
};

/**
 * Two-column results: fills remaining CalculatorPage height on lg.
 * Left charts grow; right column matches height and scrolls when needed.
 */
export const RESULTS_SPLIT = "grid grid-cols-1 gap-4 lg:grid-cols-12";
export const RESULTS_LEFT = "flex flex-col gap-4 lg:col-span-7";
export const RESULTS_RIGHT = "flex flex-col gap-4 lg:col-span-5";

const HEAD_TONE: Record<ScheduleColumnTone, string> = {
  default: "bg-[var(--app-surface)] text-[var(--app-text-subtle)]",
  std: "bg-[var(--app-std-bg)] text-[var(--app-std-text)]",
  step: "bg-[var(--app-step-bg)] text-[var(--app-step-text)]",
  warn: "bg-[var(--app-warn-bg)] text-[var(--app-warn-text)]",
};

const CELL_TONE: Record<ScheduleColumnTone, string> = {
  default: "text-[var(--app-text)]",
  std: "bg-[var(--app-std-bg-soft)] text-[var(--app-std-text-strong)]",
  step: "bg-[var(--app-step-bg-soft)] text-[var(--app-step-text-strong)]",
  warn: "bg-[var(--app-warn-bg)] text-[var(--app-warn-text-strong)]",
};

export function ScheduleTable<T extends Record<string, unknown>>({
  columns,
  rows,
  caption,
  className,
  zebra = false,
  highlightLastRow = false,
  emphasizeRow,
}: {
  columns: ScheduleColumn<T>[];
  rows: T[];
  caption?: string;
  className?: string;
  /** Alternate row backgrounds for long schedules. */
  zebra?: boolean;
  /** Emphasize the final contribution / year row. */
  highlightLastRow?: boolean;
  /** Highlight specific rows (e.g. highest SIP). */
  emphasizeRow?: (row: T, index: number) => boolean;
}) {
  return (
    <div
      className={`custom-scrollbar flex max-h-[600px] flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4 ${className ?? ""}`}
    >
      {caption ? (
        <div className="mb-3 shrink-0 text-sm font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
          {caption}
        </div>
      ) : null}
      <div className="custom-scrollbar overflow-auto rounded-md border border-[var(--app-border)]">
        <table className="w-full min-w-[28rem] text-xs">
          <thead>
            <tr className="border-b border-[var(--app-border)] text-left text-[10px] uppercase tracking-widest sm:text-xs">
              {columns.map((col) => {
                const tone = col.tone ?? "default";
                return (
                  <th
                    key={String(col.key)}
                    className={`sticky top-0 z-10 px-2.5 py-2 ${HEAD_TONE[tone]} ${
                      col.align === "right" ? "text-right" : ""
                    } ${col.sticky ? "left-0 z-20 shadow-[1px_0_0_var(--app-border)]" : ""}`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isLast = highlightLastRow && i === rows.length - 1;
              const isEmphasized = emphasizeRow?.(row, i) ?? false;
              const zebraBg =
                zebra && !isLast && !isEmphasized && i % 2 === 1
                  ? "bg-[var(--app-surface-muted)]/70"
                  : "";
              const lastBg = isLast
                ? "bg-[var(--app-step-bg)] font-semibold ring-1 ring-inset ring-[var(--app-step-text)]/25"
                : "";
              const emphBg = isEmphasized && !isLast
                ? "bg-[var(--app-warn-bg)] font-semibold ring-1 ring-inset ring-[var(--app-warn-text)]/30"
                : "";
              return (
                <tr
                  key={i}
                  className={`border-b border-[var(--app-border)]/60 transition-colors hover:bg-[var(--app-surface-muted)] ${zebraBg} ${lastBg} ${emphBg}`}
                >
                  {columns.map((col) => {
                    const raw = row[col.key as keyof T];
                    const tone = col.tone ?? "default";
                    const stickyBg = col.sticky
                      ? isLast
                        ? "bg-[var(--app-step-bg)]"
                        : isEmphasized
                          ? "bg-[var(--app-warn-bg)]"
                          : zebra && i % 2 === 1
                            ? "bg-[var(--app-surface-muted)]"
                            : "bg-[var(--app-surface)]"
                      : "";
                    const content = col.render
                      ? col.render(raw, row, i)
                      : (() => {
                          if (col.format === "inr" && typeof raw === "number") {
                            return formatINRCurrency(raw);
                          }
                          if (typeof raw === "number") {
                            return String(raw);
                          }
                          return raw == null ? "" : String(raw);
                        })();
                    return (
                      <td
                        key={String(col.key)}
                        className={`px-2.5 py-2 text-xs tabular-nums sm:text-sm ${
                          col.render ? "whitespace-normal" : "whitespace-nowrap"
                        } ${col.sticky ? "" : CELL_TONE[tone]} ${
                          col.align === "right" ? "text-right" : ""
                        } ${
                          col.sticky
                            ? `sticky left-0 z-[5] shadow-[1px_0_0_var(--app-border)] ${stickyBg}`
                            : ""
                        }`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
