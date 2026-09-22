"use client";

import { motion } from "framer-motion";
import { AnimatedCurrency } from "./animated-counter";
import { cn } from "@/lib/utils";

export function WealthMetricCard({
  title,
  value,
  description,
  badge,
  tone = "neutral",
  footer,
  trend,
  mark,
  display,
}: {
  title: string;
  value: number;
  description?: string;
  badge?: string;
  tone?: "neutral" | "positive" | "accent";
  footer?: React.ReactNode;
  trend?: string;
  mark?: React.ReactNode;
  /** Replaces the currency counter when the headline is a percent or label. */
  display?: React.ReactNode;
}) {
  const shell = {
    neutral: "border-slate-200/80",
    positive: "border-emerald-200/70",
    accent: "border-slate-300/80",
  } as const;
  const valueTone = {
    neutral: "text-slate-900",
    positive: "text-emerald-800",
    accent: "text-slate-900",
  } as const;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex h-full flex-col rounded-2xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_8px_24px_rgba(15,23,42,0.04)]",
        shell[tone],
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {mark}
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            {title}
          </div>
        </div>
        {badge ? (
          <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {badge}
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          "text-[32px] font-medium leading-none tracking-tight tabular-nums sm:text-[36px]",
          valueTone[tone],
        )}
      >
        {display ?? <AnimatedCurrency value={value} />}
      </div>
      {description ? (
        <p className="mt-2.5 text-sm leading-relaxed text-slate-500">{description}</p>
      ) : null}
      {trend ? <div className="mt-2 text-xs text-slate-400">{trend}</div> : null}
      {footer ? (
        <div className="mt-auto border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
          {footer}
        </div>
      ) : null}
    </motion.div>
  );
}
