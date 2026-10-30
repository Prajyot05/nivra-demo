"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatINRCurrency } from "@nivra/ui";

export function V2Section({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--v2-radius)] border border-[var(--v2-border)] bg-[var(--v2-surface)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--v2-border)] px-3 py-2">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[var(--v2-ink)]">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] leading-snug text-[var(--v2-muted)]">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="px-3 py-2.5">{children}</div>
    </section>
  );
}

export function V2Metric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "accent" | "muted" | "danger";
}) {
  const valueClass =
    tone === "accent"
      ? "text-[var(--v2-accent)]"
      : tone === "danger"
        ? "text-[var(--v2-danger)]"
        : tone === "muted"
          ? "text-[var(--v2-muted)]"
          : "text-[var(--v2-ink)]";

  const formatted = typeof value === "number" ? formatINRCurrency(value) : value;

  return (
    <div className="min-w-0 border-l border-[var(--v2-border)] pl-3 first:border-l-0 first:pl-0">
      <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--v2-faint)]">
        {label}
      </p>
      <div className={cn("mt-1 flex h-[22px] items-center overflow-hidden text-[18px] font-semibold tabular-nums leading-tight", valueClass)}>
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={formatted}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0, position: "absolute" }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  >
                    {formatted}
                  </motion.div>
                </AnimatePresence>
      </div>
      {hint ? <p className="mt-1 text-[12px] text-[var(--v2-muted)]">{hint}</p> : null}
    </div>
  );
}

export function V2MetricStrip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 rounded-[var(--v2-radius)] border border-[var(--v2-border)] bg-[var(--v2-surface)] px-4 py-3.5 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function V2Status({
  tone = "info",
  children,
}: {
  tone?: "info" | "error" | "warn";
  children: React.ReactNode;
}) {
  const styles =
    tone === "error"
      ? "border-[var(--v2-danger-border)] bg-[var(--v2-danger-soft)] text-[var(--v2-danger)]"
      : tone === "warn"
        ? "border-[var(--v2-warn-border)] bg-[var(--v2-warn-soft)] text-[var(--v2-warn)]"
        : "border-[var(--v2-border)] bg-[var(--v2-navy-soft)] text-[var(--v2-navy)]";
  return (
    <div className={cn("rounded-[var(--v2-radius)] border px-3 py-2.5 text-[13px]", styles)}>
      {children}
    </div>
  );
}

export function V2Button({
  children,
  onClick,
  disabled,
  variant = "secondary",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-[var(--v2-radius)] px-3 text-[13px] font-medium transition-colors disabled:opacity-50",
        variant === "primary"
          ? "bg-[var(--v2-navy)] text-[var(--v2-navy-fg)] hover:bg-[var(--v2-navy-hover)]"
          : "border border-[var(--v2-border)] bg-[var(--v2-surface)] text-[var(--v2-ink-soft)] hover:bg-[var(--v2-bg)]",
      )}
    >
      {children}
    </button>
  );
}

export function V2Table({
  columns,
  rows,
  caption,
}: {
  columns: Array<{ key: string; header: string; align?: "left" | "right" }>;
  rows: Array<Record<string, React.ReactNode>>;
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto">
      {caption ? (
        <p className="mb-2 text-[12px] font-medium text-[var(--v2-muted)]">{caption}</p>
      ) : null}
      <table className="w-full min-w-[28rem] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[var(--v2-border)] bg-[var(--v2-bg)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-2.5 py-2 text-left text-[12px] font-semibold uppercase tracking-[0.03em] text-[var(--v2-muted)]",
                  col.align === "right" && "text-right",
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[var(--v2-border)] odd:bg-[var(--v2-surface)] even:bg-[var(--v2-bg)]"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-2.5 py-2 tabular-nums text-[var(--v2-ink)]",
                    col.align === "right" && "text-right",
                  )}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function V2Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] leading-relaxed text-[var(--v2-muted)]">{children}</p>
  );
}

export function V2PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--v2-ink)]">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[14px] leading-snug text-[var(--v2-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

function V2YtBone({ className }: { className?: string }) {
  return <div className={cn("v2-yt-bone rounded-[var(--v2-radius-sm)]", className)} />;
}

/** YouTube-style gray placeholder blocks shown briefly while results recalculate. */
function V2ResultsYtSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="grid gap-3 rounded-[var(--v2-radius)] border border-[var(--v2-border)] bg-[var(--v2-surface)] px-3 py-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 border-l border-[var(--v2-border)] pl-3 first:border-l-0 first:pl-0">
            <V2YtBone className="h-3 w-16" />
            <V2YtBone className="h-5 w-28" />
            <V2YtBone className="h-2.5 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-[var(--v2-radius)] border border-[var(--v2-border)] bg-[var(--v2-surface)] p-3">
          <V2YtBone className="mb-3 h-3.5 w-28" />
          <V2YtBone className="h-[200px] w-full" />
        </div>
        <div className="rounded-[var(--v2-radius)] border border-[var(--v2-border)] bg-[var(--v2-surface)] p-3">
          <V2YtBone className="mb-3 h-3.5 w-24" />
          <V2YtBone className="mx-auto h-[180px] w-[180px] !rounded-full" />
        </div>
      </div>
      <div className="rounded-[var(--v2-radius)] border border-[var(--v2-border)] bg-[var(--v2-surface)] p-3">
        <V2YtBone className="mb-3 h-3.5 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <V2YtBone key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function V2CalculatorLayout({
  form,
  results,
  resultsLoading = false,
}: {
  form: React.ReactNode;
  results: React.ReactNode;
  /** YouTube-style skeleton while a recalculation is in flight. */
  resultsLoading?: boolean;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="space-y-2 lg:sticky lg:top-4 lg:self-start">{form}</div>
      <div className="min-w-0 space-y-3">
        {resultsLoading ? <V2ResultsYtSkeleton /> : results}
      </div>
    </div>
  );
}

export function V2NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-[var(--v2-radius-sm)] px-2.5 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-[var(--v2-navy)] text-[var(--v2-navy-fg)]"
          : "text-[var(--v2-ink-soft)] hover:bg-[var(--v2-navy-soft)]",
      )}
    >
      {children}
    </Link>
  );
}
