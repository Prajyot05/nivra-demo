"use client";

import { useId, useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisINR, formatINRCurrency } from "@nivra/ui";
import { ChartFrame, chartAxisTick } from "./chart-frame";
import { wealth, wealthChart } from "../wealth-tokens";

export type WealthWithdrawalMilestone = {
  age: number;
  label: string;
  amount: number;
};

export type WealthWithdrawalPathPoint = {
  year: number;
  corpus: number;
  /** Corpus after withdrawals at this age (when a payout occurs). */
  after?: number | null;
  /** Total withdrawal amount at this age. */
  withdrawal?: number;
};

/**
 * Corpus path with withdrawal markers. Wealth chrome replacement for
 * @nivra/ui WithdrawalPathChart.
 */
export function WealthWithdrawalPath({
  data,
  milestones,
  height = "h-[320px] sm:h-[380px]",
}: {
  data: WealthWithdrawalPathPoint[];
  milestones: WealthWithdrawalMilestone[];
  height?: string;
}) {
  const gradId = `wealth-wd-${useId().replace(/:/g, "")}`;

  const byAge = useMemo(() => {
    const map = new Map<number, WealthWithdrawalMilestone[]>();
    for (const milestone of milestones) {
      const list = map.get(milestone.age) ?? [];
      list.push(milestone);
      map.set(milestone.age, list);
    }
    return map;
  }, [milestones]);

  const uniqueAges = useMemo(() => [...byAge.keys()].sort((a, b) => a - b), [byAge]);

  const chartData = useMemo(
    () =>
      data.map((point) => {
        const withdrawal = point.withdrawal ?? 0;
        const after =
          point.after != null
            ? point.after
            : withdrawal > 0
              ? Math.max(0, point.corpus - withdrawal)
              : null;
        return {
          ...point,
          withdrawal,
          after,
          marker: withdrawal > 0 ? point.corpus : null,
        };
      }),
    [data],
  );

  const markerData = useMemo(
    () =>
      chartData
        .filter((point) => point.marker != null && Number(point.marker) > 0)
        .map((point) => ({ year: point.year, marker: point.marker as number })),
    [chartData],
  );

  const startAge = chartData[0]?.year;
  const endAge = chartData[chartData.length - 1]?.year;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 px-1">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ background: wealthChart.stepUp }} />
          Corpus
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ background: wealth.rose }} />
          Withdrawal
        </span>
      </div>
      <ChartFrame height={height}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={wealthChart.stepUp} stopOpacity={0.22} />
                <stop offset="100%" stopColor={wealthChart.stepUp} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="year"
              type="number"
              domain={
                startAge != null && endAge != null ? [startAge, endAge] : ["dataMin", "dataMax"]
              }
              allowDecimals={false}
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `Age ${v}`}
              minTickGap={28}
            />
            <YAxis
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatAxisINR(Number(v))}
              width={54}
            />
            <Tooltip
              cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }}
              content={({ active, label }) => {
                if (!active) return null;
                const age = Number(label);
                const point = chartData.find((row) => row.year === age);
                if (!point) return null;
                const goals = byAge.get(age) ?? [];
                const withdrawal = point.withdrawal ?? 0;
                const corpusAfter =
                  point.after != null ? point.after : Math.max(0, point.corpus - withdrawal);
                return (
                  <div className="min-w-[13rem] max-w-[18rem] rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.10)]">
                    <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                      {withdrawal > 0 ? "Withdrawal" : "Corpus"} · Age {age}
                    </div>
                    {goals.length > 0 ? (
                      <div className="mt-1 text-sm font-medium text-slate-900">
                        {goals.map((goal) => goal.label).join(" · ")}
                      </div>
                    ) : null}
                    <div className="mt-2 space-y-1.5 text-xs">
                      <PathRow label="Corpus before" value={point.corpus} />
                      {withdrawal > 0 ? (
                        <>
                          <PathRow label="Withdrawal" value={withdrawal} tone="rose" />
                          <PathRow label="Corpus after" value={corpusAfter} />
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              }}
            />
            {uniqueAges.map((age) => (
              <ReferenceLine
                key={`ref-${age}`}
                x={age}
                stroke={wealth.rose}
                strokeOpacity={0.35}
                strokeDasharray="3 4"
              />
            ))}
            <Area
              type="monotone"
              dataKey="corpus"
              name="Corpus"
              stroke={wealthChart.stepUp}
              strokeWidth={2.25}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0, fill: wealthChart.stepUp }}
              isAnimationActive={false}
            />
            <Scatter
              data={markerData}
              dataKey="marker"
              fill={wealth.rose}
              isAnimationActive={false}
              shape={(props: { cx?: number; cy?: number }) => {
                const { cx = 0, cy = 0 } = props;
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={8} fill={wealth.rose} fillOpacity={0.16} />
                    <circle cx={cx} cy={cy} r={4.5} fill={wealth.rose} stroke="#fff" strokeWidth={2} />
                  </g>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

function PathRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "rose";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span
        className={`font-semibold tabular-nums ${tone === "rose" ? "text-rose-700" : "text-slate-900"}`}
      >
        {formatINRCurrency(value)}
      </span>
    </div>
  );
}
