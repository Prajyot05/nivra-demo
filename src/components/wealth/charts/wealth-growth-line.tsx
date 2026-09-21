"use client";

import { useId } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisINR } from "@nivra/ui";
import { ChartFrame, ChartTooltipCard, chartAxisTick } from "./chart-frame";
import { wealthChart } from "../wealth-tokens";

export type WealthSeries = {
  key: string;
  label: string;
  color: string;
  /** area = soft fill (default for primary), line = stroke only */
  kind?: "area" | "line";
  dashed?: boolean;
};

/**
 * Multi-series growth / path chart matching Goal SIP Compare/Timeline chrome.
 */
export function WealthGrowthLine({
  data,
  xKey = "year",
  xTick = (v: string | number) => `Y${v}`,
  series,
  height = "h-[320px] sm:h-[380px]",
}: {
  data: Array<Record<string, string | number>>;
  xKey?: string;
  xTick?: (v: string | number) => string;
  series: WealthSeries[];
  height?: string;
}) {
  const gid = useId().replace(/:/g, "");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 px-1">
        {series.map((s) => (
          <span
            key={s.key}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600"
          >
            {s.dashed ? (
              <span className="h-0 w-3.5 border-t-2 border-dashed" style={{ borderColor: s.color }} />
            ) : (
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            )}
            {s.label}
          </span>
        ))}
      </div>
      <ChartFrame height={height}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {series
                .filter((s) => (s.kind ?? "area") === "area")
                .map((s) => (
                  <linearGradient key={s.key} id={`${gid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
            </defs>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={xTick}
              interval="preserveStartEnd"
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
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltipCard
                    label={xTick(label as string | number)}
                    rows={payload.map((p) => ({
                      name: series.find((s) => s.key === p.dataKey)?.label ?? String(p.name),
                      value: Number(p.value ?? 0),
                      color: String(p.color ?? p.stroke),
                    }))}
                  />
                );
              }}
            />
            {series.map((s, i) =>
              (s.kind ?? "area") === "area" ? (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  fill={`url(#${gid}-${s.key})`}
                  strokeWidth={2.1}
                  strokeDasharray={s.dashed ? "5 4" : undefined}
                  animationDuration={650 + i * 60}
                  activeDot={{ r: 3.5, strokeWidth: 0 }}
                />
              ) : (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? "5 4" : undefined}
                  dot={false}
                  animationDuration={650 + i * 60}
                  activeDot={{ r: 3.5, strokeWidth: 0 }}
                />
              ),
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

export const wealthGrowthColors = {
  primary: wealthChart.stepUp,
  secondary: wealthChart.standard,
  tertiary: wealthChart.inflAdj,
  muted: wealthChart.stated,
  warn: wealthChart.tax,
} as const;
