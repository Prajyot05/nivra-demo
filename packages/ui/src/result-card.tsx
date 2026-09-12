import { Card, SectionTitle } from "./card";
import { formatINRCurrency } from "./format";
import { ROW_PAD_X } from "./tokens";

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
  maturity: "font-bold text-[var(--app-text)]",
  gain: "text-[var(--app-step-text)]",
  inflation: "text-[var(--app-std-text)]",
  delay: "text-[var(--app-warn-muted)]",
  tax: "text-[var(--app-danger)]",
  net: "font-bold text-[var(--app-text)]",
};

export function ResultCard({
  title,
  items,
  accent = false,
  className,
}: {
  title: string;
  items: ResultItem[];
  /** Emerald title + values (e.g. Mutual Fund column). */
  accent?: boolean;
  className?: string;
}) {
  return (
    <Card padding="none" className={`shrink-0 overflow-hidden ${className ?? ""}`}>
      <div
        className={`border-b border-[var(--app-border)] bg-[var(--app-surface-muted)] ${ROW_PAD_X} py-2.5`}
      >
        <SectionTitle
          as="h3"
          strong={!accent}
          className={accent ? "text-[var(--app-step-text)]" : undefined}
        >
          {title}
        </SectionTitle>
      </div>
      <dl className="flex flex-col">
        {items.map((item, index) => {
          const tone = item.tone ?? (item.highlight ? "maturity" : "default");
          const isHighlight = Boolean(item.highlight);
          const isWarnHighlight = isHighlight && (tone === "delay" || tone === "tax");
          const isLast = index === items.length - 1;

          return (
            <div
              key={item.label}
              className={`flex items-center justify-between gap-3 ${ROW_PAD_X} py-2.5 ${
                isHighlight
                  ? isWarnHighlight
                    ? "border-y border-[var(--app-warn-border)] bg-[var(--app-warn-bg)]"
                    : "border-y border-[var(--app-step-text)]/35 bg-[var(--app-step-bg)]"
                  : `border-[var(--app-border)] ${isLast ? "border-b-0" : "border-b"}`
              }`}
            >
              <dt
                className={`min-w-0 flex-1 text-[13px] leading-snug ${
                  isHighlight
                    ? "font-semibold text-[var(--app-text)]"
                    : "font-medium text-[var(--app-text-muted)]"
                }`}
              >
                {item.label}
              </dt>
              <dd className="shrink-0 text-right">
                <div
                  className={`font-semibold tabular-nums leading-snug ${
                    isHighlight ? "text-[15px] sm:text-base" : "text-[13px] sm:text-sm"
                  } ${accent ? "text-[var(--app-step-text)]" : VALUE_TONE[tone]}`}
                >
                  {item.displayValue != null
                    ? item.displayValue
                    : formatINRCurrency(item.value ?? 0)}
                </div>
                {item.hint ? (
                  <div className="mt-0.5 text-[10px] leading-snug text-[var(--app-text-subtle)] sm:text-[11px]">
                    {item.hint}
                  </div>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>
    </Card>
  );
}
