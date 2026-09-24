"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AnimatedCurrency } from "./animated-counter";
import { IconChevron, IconTarget, WealthIconMark } from "./wealth-icons";
import { cn } from "@/lib/utils";

export type WealthAdvantageSide = {
  label: string;
  value: number | string;
  hint?: string;
  /** currency = AnimatedCurrency; text = raw string */
  kind?: "currency" | "text";
};

/**
 * Milestone “advantage” panel — MF-vs-FD / dossier dual-path chrome.
 * Slate path vs emerald path, no winner badges like Preferred / Higher Return.
 */
export function WealthAdvantagePanel({
  eyebrow,
  title,
  mark,
  meta,
  left,
  right,
  shareLabel,
  sharePct,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  mark?: ReactNode;
  meta?: ReactNode;
  left: WealthAdvantageSide;
  right: WealthAdvantageSide;
  /** Optional progress: keep/left share of right corpus (0–100). */
  shareLabel?: string;
  sharePct?: number;
  className?: string;
}) {
  const share = sharePct == null ? null : Math.min(100, Math.max(0, sharePct));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03),0_8px_24px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {mark ?? (
                <WealthIconMark tone="emerald" className="h-7 w-7">
                  <IconTarget className="h-3.5 w-3.5" />
                </WealthIconMark>
              )}
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                {eyebrow}
              </div>
            </div>
            <div className="mt-2 text-lg font-semibold leading-snug tracking-tight text-slate-900 sm:text-xl">
              {title}
            </div>
          </div>
          {meta ? <div className="flex flex-wrap gap-1.5">{meta}</div> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch sm:gap-2 sm:p-5">
        <SideCard side={left} tone="slate" />
        <div className="hidden items-center justify-center sm:flex">
          <div className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
            <IconChevron className="size-4 -rotate-90" aria-hidden />
          </div>
        </div>
        <SideCard side={right} tone="emerald" />
      </div>

      {share != null && shareLabel ? (
        <div className="border-t border-slate-100 px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>{shareLabel}</span>
            <span className="font-semibold tabular-nums text-slate-700">
              {Math.round(share)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500/80 transition-all duration-500"
              style={{ width: `${share}%` }}
            />
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

function SideCard({
  side,
  tone,
}: {
  side: WealthAdvantageSide;
  tone: "slate" | "emerald";
}) {
  const shell =
    tone === "emerald"
      ? "border-emerald-200/70 bg-emerald-50/50"
      : "border-slate-200/80 bg-slate-50/70";
  const labelTone = tone === "emerald" ? "text-emerald-700" : "text-slate-500";
  const valueTone = tone === "emerald" ? "text-emerald-950" : "text-slate-900";
  const hintTone = tone === "emerald" ? "text-emerald-700/80" : "text-slate-500";

  return (
    <div className={cn("rounded-xl border px-3.5 py-3", shell)}>
      <div className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", labelTone)}>
        {side.label}
      </div>
      <div className={cn("mt-1.5 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl", valueTone)}>
        {side.kind === "text" || typeof side.value === "string" ? (
          side.value
        ) : (
          <AnimatedCurrency value={side.value} />
        )}
      </div>
      {side.hint ? (
        <div className={cn("mt-1 text-[12px] leading-snug", hintTone)}>{side.hint}</div>
      ) : null}
    </div>
  );
}

export type WealthProcessStep = {
  n: string | number;
  label: string;
  value: string;
  sub?: string;
  tone?: "slate" | "amber" | "emerald";
};

/**
 * Numbered process rail — Teenage Engineering checkout step clarity,
 * adapted to Nivra slate/emerald wealth chrome.
 */
export function WealthProcessSteps({
  title,
  subtitle,
  steps,
  className,
}: {
  title: string;
  subtitle?: string;
  steps: WealthProcessStep[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
          {title}
        </div>
        {subtitle ? <div className="text-[12px] text-slate-500">{subtitle}</div> : null}
      </div>
      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          steps.length >= 4
            ? "min-[560px]:grid-cols-2 xl:grid-cols-4"
            : "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {steps.map((step, i) => {
          const tone = step.tone ?? (i === steps.length - 1 ? "emerald" : "slate");
          const box =
            tone === "emerald"
              ? "border-emerald-200/70 bg-emerald-50/50"
              : tone === "amber"
                ? "border-amber-200/80 bg-amber-50/60"
                : "border-slate-200/80 bg-slate-50/60";
          const badge =
            tone === "emerald"
              ? "border-emerald-600 bg-emerald-700 text-white"
              : tone === "amber"
                ? "border-amber-300 bg-white text-amber-900"
                : "border-slate-200 bg-white text-slate-600";
          const labelTone =
            tone === "emerald"
              ? "text-emerald-700"
              : tone === "amber"
                ? "text-amber-800"
                : "text-slate-500";
          const valueTone =
            tone === "emerald"
              ? "text-emerald-950"
              : tone === "amber"
                ? "text-amber-950"
                : "text-slate-900";

          return (
            <div
              key={`${step.n}-${step.label}`}
              className={cn("flex items-start gap-3 rounded-xl border px-3 py-3", box)}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums",
                  badge,
                )}
              >
                {step.n}
              </div>
              <div className="min-w-0">
                <div className={cn("text-[10px] font-semibold uppercase tracking-[0.12em]", labelTone)}>
                  {step.label}
                </div>
                <div className={cn("mt-1 text-[14px] font-semibold tabular-nums leading-snug", valueTone)}>
                  {step.value}
                </div>
                {step.sub ? (
                  <div className="mt-0.5 text-[11px] leading-snug text-slate-500">{step.sub}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type WealthPathStat = {
  label: string;
  value: string;
  hint?: string;
  emphasize?: boolean;
  tone?: "neutral" | "amber" | "emerald";
};

/**
 * Dual path detail cards — executive dossier dark-slate vs emerald pair.
 */
export function WealthPathPair({
  leftTitle,
  leftBadge,
  leftStats,
  rightTitle,
  rightBadge,
  rightStats,
  className,
}: {
  leftTitle: string;
  leftBadge?: string;
  leftStats: WealthPathStat[];
  rightTitle: string;
  rightBadge?: string;
  rightStats: WealthPathStat[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      <PathCard
        title={leftTitle}
        badge={leftBadge}
        stats={leftStats}
        accent="slate"
      />
      <PathCard
        title={rightTitle}
        badge={rightBadge}
        stats={rightStats}
        accent="emerald"
      />
    </div>
  );
}

function PathCard({
  title,
  badge,
  stats,
  accent,
}: {
  title: string;
  badge?: string;
  stats: WealthPathStat[];
  accent: "slate" | "emerald";
}) {
  const header =
    accent === "emerald"
      ? "border-emerald-100 bg-emerald-50/70 text-emerald-800"
      : "border-slate-100 bg-slate-50/80 text-slate-500";
  const border =
    accent === "emerald" ? "border-emerald-200/70" : "border-slate-200/80";

  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-white", border)}>
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-b px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
          header,
        )}
      >
        <span>{title}</span>
        {badge ? (
          <span className="rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-800">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2.5 p-3.5">
        {stats.map((stat) => {
          const cellTone =
            stat.tone === "emerald"
              ? "bg-emerald-50/80"
              : stat.tone === "amber"
                ? "bg-amber-50/70"
                : stat.emphasize
                  ? accent === "emerald"
                    ? "bg-emerald-50/80"
                    : "bg-slate-50"
                  : "";
          const valueTone =
            stat.tone === "emerald"
              ? "text-emerald-900"
              : stat.tone === "amber"
                ? "text-amber-900"
                : "text-slate-900";
          const labelTone =
            stat.tone === "emerald"
              ? "text-emerald-700"
              : stat.tone === "amber"
                ? "text-amber-800"
                : "text-slate-500";

          return (
            <div
              key={stat.label}
              className={cn("rounded-lg px-2 py-1.5", cellTone)}
            >
              <div className={cn("text-[10px]", labelTone)}>{stat.label}</div>
              <div className={cn("mt-0.5 text-[13px] font-semibold tabular-nums", valueTone)}>
                {stat.value}
              </div>
              {stat.hint ? (
                <div className="mt-0.5 text-[10px] text-slate-400">{stat.hint}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
