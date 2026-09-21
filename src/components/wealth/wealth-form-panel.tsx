"use client";

import { cn } from "@/lib/utils";

/**
 * Soft section panel — Fingerprint / Linktree settings:
 * title 14/600, subtitle 13/18, 20px to first row.
 */
export function WealthFormPanel({
  title,
  description,
  children,
  className,
  aside,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  aside?: React.ReactNode;
}) {
  return (
    <section className={cn(className)}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h4 className="text-[14px] font-semibold leading-5 text-slate-900">{title}</h4>
          {description ? (
            <p className="mt-0.5 text-[13px] leading-[18px] text-slate-500">{description}</p>
          ) : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/**
 * Kickstarter-style computed value — tinted read-only, never looks editable.
 */
export function WealthComputedValue({
  label,
  value,
  hint,
  tone = "slate",
  size = "md",
  delta,
  className,
  children,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "slate" | "emerald";
  size?: "md" | "lg";
  delta?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const tones = {
    slate: "border-slate-200/80 bg-slate-50",
    emerald: "border-emerald-200/70 bg-emerald-50/80",
  } as const;

  return (
    <div
      className={cn("rounded-2xl border px-4 py-3.5", tones[tone], className)}
      aria-live="polite"
    >
      <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 font-semibold tabular-nums tracking-tight",
          tone === "emerald" ? "text-emerald-900" : "text-slate-900",
          size === "lg" ? "text-[28px] leading-none sm:text-[32px]" : "text-[17px] leading-tight",
        )}
      >
        {value}
      </div>
      {delta ? (
        <p
          className={cn(
            "mt-2 text-[12px] font-medium leading-snug",
            tone === "emerald" ? "text-emerald-800/85" : "text-slate-500",
          )}
        >
          {delta}
        </p>
      ) : null}
      {hint ? (
        <p className="mt-1.5 text-[12px] leading-snug text-slate-500">{hint}</p>
      ) : null}
      {children}
    </div>
  );
}

/** Compact assumption-change banner. */
export function WealthChangeNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <div
      className={cn(
        "rounded-xl border border-emerald-200/60 bg-white/70 px-3 py-2 text-[12px] leading-snug text-emerald-900",
        className,
      )}
      role="status"
    >
      {children}
    </div>
  );
}
