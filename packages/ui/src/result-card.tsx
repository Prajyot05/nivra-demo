import { formatINRCurrency } from "./format";

export type ResultTone =
  | "default"
  | "maturity"
  | "gain"
  | "inflation"
  | "delay"
  | "tax"
  | "net";

export type ResultItem = {
  label: string;
  /** Numeric amount when showing INR. Optional when `displayValue` is set. */
  value?: number;
  /** Non-currency text (e.g. "2 Payments", "Half-Yearly"). */
  displayValue?: string;
  /** Secondary line under the value. */
  hint?: string;
  /** Emphasize this row (e.g. final maturity). */
  highlight?: boolean;
  /** Colored value styling (display only). */
  tone?: ResultTone;
};

const VALUE_TONE: Record<ResultTone, string> = {
  default: "text-[var(--app-text)]",
  maturity: "font-bold text-[var(--app-step-text-strong)]",
  gain: "font-semibold text-[var(--app-step-text)]",
  inflation: "font-semibold text-[var(--app-std-text)]",
  delay: "font-semibold text-[var(--app-warn-muted)]",
  tax: "font-semibold text-[var(--app-danger)]",
  net: "font-bold text-[var(--app-step-text-strong)]",
};

const HIGHLIGHT_ROW: Record<ResultTone, string> = {
  default: "rounded-md border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2.5 py-2 last:pb-2",
  maturity:
    "rounded-md border border-[var(--app-step-text)]/20 bg-[var(--app-step-bg)] px-2.5 py-2 last:pb-2",
  gain: "rounded-md border border-[var(--app-step-text)]/20 bg-[var(--app-step-bg)] px-2.5 py-2 last:pb-2",
  inflation:
    "rounded-md border border-[var(--app-std-text)]/20 bg-[var(--app-std-bg)] px-2.5 py-2 last:pb-2",
  delay: "rounded-md border border-[var(--app-warn-text)]/25 bg-[var(--app-warn-bg)] px-2.5 py-2 last:pb-2",
  tax: "rounded-md border border-[var(--app-danger)]/20 bg-[var(--app-danger)]/5 px-2.5 py-2 last:pb-2",
  net: "rounded-md border border-[var(--app-step-text)]/20 bg-[var(--app-step-bg)] px-2.5 py-2 last:pb-2",
};

const HIGHLIGHT_LABEL: Record<ResultTone, string> = {
  default: "text-[var(--app-text)]",
  maturity: "text-[var(--app-step-text-strong)]",
  gain: "text-[var(--app-step-text-strong)]",
  inflation: "text-[var(--app-std-text)]",
  delay: "text-[var(--app-warn-text-strong)]",
  tax: "text-[var(--app-danger)]",
  net: "text-[var(--app-step-text-strong)]",
};

export function ResultCard({
  title,
  items,
}: {
  title: string;
  items: ResultItem[];
}) {
  return (
    <div className="flex shrink-0 flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-3.5">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        {title}
      </h3>
      <dl className="mt-2.5 flex flex-col gap-2">
        {items.map((item) => {
          const tone = item.tone ?? (item.highlight ? "maturity" : "default");
          return (
            <div
              key={item.label}
              className={`flex items-start justify-between gap-3 border-b border-[var(--app-border)] border-dashed pb-2 last:border-0 last:pb-0 ${
                item.highlight ? HIGHLIGHT_ROW[tone] : ""
              }`}
            >
              <dt
                className={`min-w-0 flex-1 pt-0.5 text-xs font-medium leading-snug ${
                  item.highlight ? HIGHLIGHT_LABEL[tone] : "text-[var(--app-text-muted)]"
                }`}
              >
                {item.label}
              </dt>
              <dd className="shrink-0 text-right">
                <div
                  className={`tabular-nums leading-snug ${
                    item.highlight ? "text-sm sm:text-base" : "text-xs sm:text-sm"
                  } ${VALUE_TONE[tone]}`}
                >
                  {item.displayValue != null
                    ? item.displayValue
                    : formatINRCurrency(item.value ?? 0)}
                </div>
                {item.hint ? (
                  <div className="mt-0.5 text-[10px] leading-snug text-[var(--app-text-subtle)]">
                    {item.hint}
                  </div>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
