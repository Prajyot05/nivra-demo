"use client";

import { Children, cloneElement, isValidElement, useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Field shell — Midday ledger + Mercury focus:
 * 40px input, 13px label, quiet emerald focus ring.
 */
export function WealthFieldShell({
  label,
  helper,
  error,
  prefix,
  suffix,
  children,
  className,
  inputId,
}: {
  label: string;
  helper?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  children: React.ReactNode;
  className?: string;
  inputId?: string;
}) {
  const autoId = useId();
  const id = inputId ?? autoId;

  const child = Children.map(children, (node) => {
    if (!isValidElement(node)) return node;
    return cloneElement(node as React.ReactElement<{ id?: string }>, { id });
  });

  return (
    <div className={cn("group block", className)}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium leading-4 text-slate-600"
      >
        {label}
      </label>
      <div
        className={cn(
          "relative flex h-10 items-center rounded-md border border-slate-300 bg-white transition",
          "hover:border-slate-400",
          "focus-within:border-emerald-500 focus-within:ring-[3px] focus-within:ring-emerald-500/20",
          error &&
            "border-rose-400 hover:border-rose-400 focus-within:border-rose-400 focus-within:ring-rose-400/20",
        )}
      >
        {prefix ? (
          <span className="pointer-events-none shrink-0 pl-3 text-[14px] leading-5 text-slate-500">
            {prefix}
          </span>
        ) : null}
        {child}
        {suffix ? (
          <span className="pointer-events-none shrink-0 pr-3 text-[13px] leading-5 text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <span className="mt-1.5 block text-[12px] leading-4 text-rose-600">{error}</span>
      ) : helper ? (
        <span className="mt-1.5 block text-[12px] leading-4 text-slate-500">{helper}</span>
      ) : null}
    </div>
  );
}

/** Quiet subsection title inside Profile — hairline, not a card. */
export function WealthFormSection({
  title,
  description,
  aside,
  children,
  className,
}: {
  title: string;
  description?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <div className="min-w-0">
          <h4 className="text-[14px] font-semibold leading-5 text-slate-900">{title}</h4>
          {description ? (
            <p className="mt-0.5 text-[13px] leading-[18px] text-slate-500">{description}</p>
          ) : null}
        </div>
        {aside}
      </div>
      {children}
    </div>
  );
}

export const wealthInputClass =
  "!h-10 w-full min-w-0 flex-1 !rounded-md !border-0 !bg-transparent !px-3 !py-0 !text-[14px] leading-5 text-slate-900 tabular-nums !shadow-none outline-none placeholder:text-slate-400 focus-visible:!ring-0";

/** Goal amount: same box, slightly stronger value weight. */
export const wealthInputEmphasizedClass =
  "!h-10 w-full min-w-0 flex-1 !rounded-md !border-0 !bg-transparent !px-3 !py-0 !text-[15px] font-semibold leading-5 text-slate-900 tabular-nums !shadow-none outline-none placeholder:text-slate-400 focus-visible:!ring-0";
