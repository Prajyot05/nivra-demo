"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisINR, formatINRCurrency, formatPercent } from "@nivra/ui";
import { wealthChart } from "../wealth-tokens";
import { ChartFrame, ChartTooltipCard, chartAxisTick } from "./chart-frame";

/**
 * Inflation impact — locked to:
 * - Monarch Cash Flow: dense KPI strip (no card cluster)
 * - Resend Audience metrics: soft dual-series area + quiet grid + end markers
 */
export function InflationImpactChart({
  statedGoal,
  inflAdjGoal,
  tenure,
  inflationPct,
}: {
  statedGoal: number;
  inflAdjGoal: number;
  tenure: number;
  inflationPct: number;
}) {
  const years = Math.max(1, tenure);
  const rate = Math.max(0, inflationPct) / 100;
  const data = Array.from({ length: years + 1 }, (_, i) => {
    const inflated =
      rate > 0 ? statedGoal * Math.pow(1 + rate, i) : statedGoal;
    return {
      year: i,
      stated: statedGoal,
      inflated,
      gap: Math.max(0, inflated - statedGoal),
    };
  });

  const terminal = data[data.length - 1]?.inflated ?? inflAdjGoal;
  const displayAdj = inflAdjGoal > 0 ? inflAdjGoal : terminal;
  const gap = Math.max(0, displayAdj - statedGoal);
  const gapPct = statedGoal > 0 ? (gap / statedGoal) * 100 : 0;
  const endYear = years;
  const endStated = statedGoal;
  const endInflated = terminal;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-4 sm:grid-cols-4 sm:gap-6">
        <Metric
          label="Stated goal"
          value={formatINRCurrency(statedGoal)}
        />
        <Metric
          label="Inflation-adjusted"
          value={formatINRCurrency(displayAdj)}
          valueClass="text-teal-800"
        />
        <Metric
          label="Extra needed"
          value={formatINRCurrency(gap)}
          hint={`+${formatPercent(gapPct, 0)}`}
          valueClass="text-amber-800"
        />
        <Metric
          label="Assumed inflation"
          value={formatPercent(inflationPct)}
          hint={`Over ${years} yrs`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[13px] leading-snug text-slate-500">
          Same purchasing power as today costs{" "}
          <span className="font-medium tabular-nums text-slate-800">
            {formatINRCurrency(displayAdj)}
          </span>{" "}
          in year {years} at {formatPercent(inflationPct)} inflation.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <LegendMark
            swatch={
              <span className="h-0 w-3.5 border-t-2 border-dashed border-slate-400" />
            }
            label="Stated"
          />
          <LegendMark
            swatch={
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: wealthChart.inflAdj }}
              />
            }
            label="Inflation-adjusted"
          />
        </div>
      </div>

      <ChartFrame height="h-[300px] sm:h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="inflAdjFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={wealthChart.inflAdj} stopOpacity={0.22} />
                <stop offset="55%" stopColor={wealthChart.inflAdj} stopOpacity={0.06} />
                <stop offset="100%" stopColor={wealthChart.inflAdj} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="year"
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v === 0 ? "Now" : `Y${v}`)}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatAxisINR(Number(v))}
              width={54}
              domain={[0, "auto"]}
            />
            <Tooltip
              cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as {
                  stated: number;
                  inflated: number;
                  gap: number;
                };
                return (
                  <ChartTooltipCard
                    label={label === 0 ? "Today" : `Year ${label}`}
                    rows={[
                      {
                        name: "Stated goal",
                        value: row.stated,
                        color: wealthChart.stated,
                      },
                      {
                        name: "Inflation-adjusted",
                        value: row.inflated,
                        color: wealthChart.inflAdj,
                      },
                      {
                        name: "Extra needed",
                        value: row.gap,
                        color: "#D97706",
                      },
                    ]}
                  />
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="inflated"
              stroke={wealthChart.inflAdj}
              fill="url(#inflAdjFill)"
              strokeWidth={2.25}
              animationDuration={750}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="stated"
              stroke={wealthChart.stated}
              strokeWidth={1.75}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0, fill: wealthChart.stated }}
              animationDuration={650}
            />
            <ReferenceDot
              x={endYear}
              y={endStated}
              r={3.5}
              fill={wealthChart.stated}
              stroke="none"
            />
            <ReferenceDot
              x={endYear}
              y={endInflated}
              r={4.5}
              fill={wealthChart.inflAdj}
              stroke="#fff"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <div
        className={`mt-1 truncate text-[15px] font-medium tracking-tight tabular-nums sm:text-[16px] ${valueClass}`}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-0.5 text-[11px] tabular-nums text-slate-400">{hint}</div>
      ) : null}
    </div>
  );
}

function LegendMark({
  swatch,
  label,
}: {
  swatch: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
      {swatch}
      {label}
    </span>
  );
}
