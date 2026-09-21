"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from "recharts";
import { formatINRCurrency, formatPercent } from "@nivra/ui";
import { cn } from "@/lib/utils";
import { wealthChart } from "../wealth-tokens";

export type WealthMixSlice = { name: string; value: number; color: string };

function donutCenterAmountClass(value: number) {
  const len = formatINRCurrency(value).replace(/\s/g, "").length;
  if (len >= 16) return "text-[11px] leading-snug sm:text-[12px]";
  if (len >= 14) return "text-[13px] leading-snug sm:text-[14px]";
  if (len >= 12) return "text-[15px] leading-tight sm:text-[16px]";
  return "text-[17px] leading-tight sm:text-[18px]";
}

function ActiveSlice(props: {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
}) {
  const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0, startAngle = 0, endAngle = 0, fill } =
    props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 5}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      cornerRadius={6}
    />
  );
}

/**
 * Goal SIP corpus-mix donut — shared across calculators.
 * Locked to Monarch / Mercury: soft ring, center swap on hover, legend + tax/net footer.
 */
export function WealthMixDonut({
  title,
  eyebrow = "Corpus mix",
  slices,
  centerValue,
  centerLabel = "Pre-tax",
  tax,
  net,
  netLabel = "Net corpus",
}: {
  title: string;
  eyebrow?: string;
  slices: WealthMixSlice[];
  centerValue: number;
  centerLabel?: string;
  tax?: number;
  net?: number;
  netLabel?: string;
}) {
  const [active, setActive] = useState<number | undefined>(undefined);
  const data = slices.filter((s) => s.value > 0);
  const sum = slices.reduce((n, s) => n + Math.max(0, s.value), 0);
  const activeSlice = active !== undefined ? data[active] : undefined;
  const activePct = activeSlice && sum > 0 ? (activeSlice.value / sum) * 100 : 0;

  return (
    <article className="rounded-2xl border border-slate-200/90 bg-white p-5">
      <header className="flex items-baseline justify-between gap-3">
        <h4 className="text-[15px] font-medium text-slate-900">{title}</h4>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
          {eyebrow}
        </span>
      </header>

      <div className="mt-5 flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-8">
        <div className="relative h-[240px] w-[240px] shrink-0 sm:h-[260px] sm:w-[260px]">
          <div className="pointer-events-none absolute inset-[20%] rounded-full bg-slate-50/80" />
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[{ value: 1 }]}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius="64%"
                outerRadius="94%"
                fill="#F1F5F9"
                stroke="none"
                isAnimationActive={false}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="64%"
                outerRadius="90%"
                paddingAngle={3}
                cornerRadius={7}
                stroke="#FFFFFF"
                strokeWidth={3}
                isAnimationActive
                animationDuration={550}
                activeIndex={active}
                activeShape={ActiveSlice}
                onMouseEnter={(_, i) => setActive(i)}
                onMouseLeave={() => setActive(undefined)}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2">
            <div className="w-[68%] max-w-[150px] text-center transition-opacity duration-150">
              {activeSlice ? (
                <>
                  <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    {activeSlice.name}
                  </div>
                  <div
                    className={cn(
                      "mt-1 font-medium tracking-tight tabular-nums text-slate-900",
                      donutCenterAmountClass(activeSlice.value),
                    )}
                  >
                    {formatINRCurrency(activeSlice.value)}
                  </div>
                  <div className="mt-1 text-[11px] tabular-nums text-slate-500">
                    {formatPercent(activePct, 1)}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={cn(
                      "font-medium tracking-tight tabular-nums text-slate-900",
                      donutCenterAmountClass(centerValue),
                    )}
                  >
                    {formatINRCurrency(centerValue)}
                  </div>
                  <div className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    {centerLabel}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="w-full min-w-0 flex-1">
          <ul className="space-y-0.5">
            {slices.map((s) => {
              const pct = sum > 0 ? (s.value / sum) * 100 : 0;
              const isActive = active !== undefined && data[active]?.name === s.name;
              return (
                <li
                  key={s.name}
                  onMouseEnter={() => {
                    const idx = data.findIndex((d) => d.name === s.name);
                    if (idx >= 0) setActive(idx);
                  }}
                  onMouseLeave={() => setActive(undefined)}
                  className={cn(
                    "flex cursor-default items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 transition",
                    isActive ? "bg-slate-50" : "hover:bg-slate-50/70",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ background: s.color }}
                    />
                    <span className="text-sm font-medium text-slate-800">{s.name}</span>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-2.5 text-right">
                    <span className="text-xs tabular-nums text-slate-400">
                      {formatPercent(pct, 1)}
                    </span>
                    <span className="min-w-[6.75rem] text-sm font-medium tabular-nums text-slate-900">
                      {formatINRCurrency(s.value)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {tax != null || net != null ? (
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              {tax != null ? (
                <div className="flex items-center justify-between px-2.5 text-sm">
                  <span className="text-slate-500">Estimated tax</span>
                  <span className="font-medium tabular-nums text-amber-800">
                    {formatINRCurrency(tax)}
                  </span>
                </div>
              ) : null}
              {net != null ? (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50/90 px-3 py-2.5">
                  <span className="text-sm font-medium text-emerald-900">{netLabel}</span>
                  <span className="text-[16px] font-medium tabular-nums text-emerald-900">
                    {formatINRCurrency(net)}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export const wealthMixColors = {
  invested: wealthChart.invested,
  gain: wealthChart.gain,
  tax: wealthChart.tax,
  secondary: "#475569",
  secondaryGain: "#059669",
} as const;
