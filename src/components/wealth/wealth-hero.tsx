"use client";

import { motion } from "framer-motion";
import { AnimatedCurrency, AnimatedPercent } from "./animated-counter";
import { IconEdit, IconMail, IconPhone, IconSip, IconTarget, WealthIconMark } from "./wealth-icons";
import { cn } from "@/lib/utils";

function KpiCard({
  label,
  children,
  tone = "emerald",
  mark,
}: {
  label: string;
  children: React.ReactNode;
  tone?: "emerald" | "slate";
  mark?: React.ReactNode;
}) {
  const tones = {
    emerald: "bg-emerald-50/40",
    slate: "bg-slate-50",
  } as const;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "rounded-2xl border border-slate-900/[0.05] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
        tones[tone],
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        {mark}
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
          {label}
        </div>
      </div>
      <div className="text-[26px] font-medium leading-none tracking-tight text-slate-900 tabular-nums sm:text-[30px]">
        {children}
      </div>
    </motion.div>
  );
}

export type WealthHeroMetric = {
  label: string;
  value: number;
  kind: "currency" | "percent";
  tone?: "emerald" | "slate";
  mark?: React.ReactNode;
};

export function WealthHero({
  clientName,
  age,
  email,
  phone,
  goalLabel,
  tenure,
  strategy,
  onEdit,
  metrics,
  /** @deprecated Prefer `metrics`. Kept for Goal SIP. */
  targetCorpus,
  monthlySip,
  realReturnPct,
}: {
  clientName: string;
  age: number;
  email: string;
  phone: string;
  goalLabel: string;
  tenure: number;
  strategy: string;
  onEdit: () => void;
  metrics?: WealthHeroMetric[];
  targetCorpus?: number;
  monthlySip?: number;
  realReturnPct?: number;
}) {
  const resolved: WealthHeroMetric[] =
    metrics ??
    [
      {
        label: "Target Corpus",
        value: targetCorpus ?? 0,
        kind: "currency" as const,
        tone: "emerald" as const,
        mark: (
          <WealthIconMark tone="emerald" className="h-6 w-6">
            <IconTarget className="h-3.5 w-3.5" />
          </WealthIconMark>
        ),
      },
      {
        label: "Monthly SIP",
        value: monthlySip ?? 0,
        kind: "currency" as const,
        tone: "slate" as const,
        mark: (
          <WealthIconMark className="h-6 w-6">
            <IconSip className="h-3.5 w-3.5" />
          </WealthIconMark>
        ),
      },
      {
        label: "Real Return",
        value: realReturnPct ?? 0,
        kind: "percent" as const,
        tone: "slate" as const,
      },
    ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl border border-slate-900/[0.05] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.05)] sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Client
          </div>
          <h2 className="mt-1 text-[32px] font-medium leading-tight tracking-tight text-slate-900 sm:text-[36px]">
            {clientName || "Client"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Age {age}
            <span className="mx-2 text-slate-300">·</span>
            {tenure} year horizon
            <span className="mx-2 text-slate-300">·</span>
            {strategy}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-800">
              {goalLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconMail className="h-3.5 w-3.5 text-slate-400" />
              {email}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconPhone className="h-3.5 w-3.5 text-slate-400" />
              {phone}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
        >
          <IconEdit className="h-3.5 w-3.5" />
          Edit client
        </button>
      </div>

      <div
        className={cn(
          "mt-6 grid grid-cols-1 gap-3",
          resolved.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
        )}
      >
        {resolved.map((m) => (
          <KpiCard key={m.label} label={m.label} tone={m.tone ?? "slate"} mark={m.mark}>
            {m.kind === "currency" ? (
              <AnimatedCurrency value={m.value} />
            ) : (
              <AnimatedPercent value={m.value} />
            )}
          </KpiCard>
        ))}
      </div>
    </motion.section>
  );
}
