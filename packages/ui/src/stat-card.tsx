import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { formatINRCurrency } from "./format";

export type StatCardTone = "positive" | "neutral" | "negative" | "default";

/**
 * Headline metric cards — dashed semantic borders matching the Nivra
 * premium fintech system (emerald / slate / rose).
 */
export function StatCard({
  title,
  value,
  hint,
  footer,
  badge,
  tone = "default",
  /** @deprecated use `tone` instead */
  variant,
}: {
  title: string;
  value: number;
  hint?: string;
  footer?: ReactNode;
  /** Optional pill in the top-right (e.g. "1.35x Multiplier"). */
  badge?: ReactNode;
  tone?: StatCardTone;
  variant?: "primary" | "soft";
}) {
  // Map legacy filled variants when tone was omitted.
  const resolvedTone: StatCardTone =
    tone !== "default"
      ? tone
      : variant === "soft"
        ? "neutral"
        : variant === "primary"
          ? "positive"
          : "default";

  const tones = {
    positive: {
      wrapper:
        "border-[1.5px] border-dashed border-emerald-500 bg-[linear-gradient(180deg,rgba(236,253,245,0.45)_0%,rgba(255,255,255,0.95)_100%)]",
      icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />,
      titleText: "text-emerald-700",
      valueText: "text-slate-900",
      hintText: "text-emerald-800/80",
      borderTop: "border-emerald-100",
    },
    neutral: {
      wrapper:
        "border-[1.5px] border-dashed border-slate-300 bg-[linear-gradient(180deg,rgba(248,250,252,0.7)_0%,rgba(255,255,255,0.95)_100%)]",
      icon: <Info className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />,
      titleText: "text-slate-500",
      valueText: "text-slate-900",
      hintText: "text-slate-500",
      borderTop: "border-slate-200",
    },
    negative: {
      wrapper:
        "border-[1.5px] border-dashed border-rose-300 bg-[linear-gradient(180deg,rgba(255,241,242,0.55)_0%,rgba(255,255,255,0.95)_100%)]",
      icon: <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" strokeWidth={2} />,
      titleText: "text-rose-700",
      valueText: "text-slate-900",
      hintText: "text-rose-600",
      borderTop: "border-rose-100",
    },
    default: {
      wrapper: "border border-slate-200 bg-white",
      icon: null,
      titleText: "text-slate-500",
      valueText: "text-slate-900",
      hintText: "text-slate-500",
      borderTop: "border-slate-200",
    },
  } as const;

  const selected = tones[resolvedTone];

  return (
    <div
      className={`flex min-h-[5.5rem] min-w-0 flex-col justify-center rounded-2xl px-5 py-5 transition-shadow hover:shadow-md sm:px-6 sm:py-6 ${selected.wrapper}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div
          className={`flex min-w-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${selected.titleText}`}
        >
          {selected.icon}
          <span className="truncate">{title}</span>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      <div
        className={`text-2xl font-extrabold leading-tight tracking-tight tabular-nums sm:text-3xl ${selected.valueText}`}
      >
        {formatINRCurrency(value)}
      </div>
      {hint ? (
        <p className={`mt-2 text-xs font-medium leading-snug ${selected.hintText}`}>{hint}</p>
      ) : null}
      {footer ? (
        <div
          className={`mt-3 border-t pt-2.5 text-xs font-medium leading-snug ${selected.borderTop} ${selected.hintText}`}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
