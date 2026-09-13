import type { ReactNode } from "react";
import { Card, SectionHeader } from "./card";
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

const HEAD_TONE: Record<ScheduleColumnTone, string> = {
  default: "text-[var(--app-text)]",
  std: "text-[var(--app-std-text)]",
  step: "text-[var(--app-step-text)]",
  warn: "text-[var(--app-warn-text)]",
};

const CELL_TONE: Record<ScheduleColumnTone, string> = {
  default: "text-[var(--app-text)]",
  std: "text-[var(--app-std-text)]",
  step: "text-[var(--app-step-text)]",
  warn: "text-[var(--app-warn-text)]",
};

export function ScheduleTable<T extends Record<string, unknown>>({
  columns,
  rows,
  caption,
  meta,
  className,
  zebra = false,
  highlightLastRow = false,
  emphasizeRow,
  fillHeight = false,
  stretchRows,
  fitContent = false,
  dense = false,
}: {
  columns: ScheduleColumn<T>[];
  rows: T[];
  caption?: string;
  /** Right-aligned summary beside the caption (totals, row counts). */
  meta?: ReactNode;
  className?: string;
  /** Alternate row backgrounds for long schedules. */
  zebra?: boolean;
  /** Emphasize the final contribution / year row. */
  highlightLastRow?: boolean;
  /** Highlight specific rows (e.g. highest SIP). */
  emphasizeRow?: (row: T, index: number) => boolean;
  /** Stretch the card to fill the parent. Extra rows scroll unless `stretchRows`. */
  fillHeight?: boolean;
  /** Distribute row height so the table body fills the card. Defaults to `fillHeight`. */
  stretchRows?: boolean;
  /** Size table to content instead of stretching columns across the card. */
  fitContent?: boolean;
  /** Tighter cell padding for long schedules. */
  dense?: boolean;
}) {
  const growRows = stretchRows ?? fillHeight;
  // Narrow schedules should fit a phone instead of forcing a horizontal scroll.
  const minWidth = `${Math.max(dense ? 16 : 18, columns.length * (dense ? 5.25 : 6.5))}rem`;
  const cellPad = dense ? "px-2 py-1.5" : "px-3 py-2";

  return (
    <Card
      className={`${fillHeight ? "h-full max-h-none overflow-hidden" : "max-h-[540px]"} custom-scrollbar ${className ?? ""}`}
    >
      {caption || meta ? (
        <SectionHeader title={caption} meta={meta} className="mb-2 shrink-0" />
      ) : null}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-auto rounded-lg border border-[var(--app-border)]">
        <table
          className={`${fitContent ? "w-max max-w-full" : "w-full"} text-xs ${growRows ? "h-full" : ""}`}
          style={{ minWidth }}
        >
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider sm:text-[11px]">
              {columns.map((col) => {
                const tone = col.tone ?? "default";
                return (
                  <th
                    key={String(col.key)}
                    className={`sticky top-0 z-10 border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] ${cellPad} whitespace-nowrap ${
                      HEAD_TONE[tone]
                    } ${col.align === "right" ? "text-right" : ""} ${
                      col.sticky ? "left-0 z-20 shadow-[1px_0_0_var(--app-border)]" : ""
                    }`}
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
                  ? "bg-[var(--app-surface-muted)]/50"
                  : "";
              const lastBg = isLast
                ? "border-y border-[var(--app-step-text)]/35 bg-[var(--app-step-bg)] font-semibold"
                : "";
              const emphBg =
                isEmphasized && !isLast ? "bg-[var(--app-warn-bg)] font-semibold" : "";
              return (
                <tr
                  key={i}
                  className={`${
                    isLast ? "" : "border-b border-[var(--app-border)]"
                  } transition-colors hover:bg-[var(--app-surface-muted)]/60 ${zebraBg} ${lastBg} ${emphBg} ${
                    growRows ? "h-[1%]" : ""
                  }`}
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
                        className={`${cellPad} text-[11px] font-medium tabular-nums sm:text-xs ${
                          growRows && !dense ? "py-3.5" : ""
                        } ${col.render ? "whitespace-normal" : "whitespace-nowrap"} ${
                          col.sticky ? "" : CELL_TONE[tone]
                        } ${col.align === "right" ? "text-right" : ""} ${
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
    </Card>
  );
}
