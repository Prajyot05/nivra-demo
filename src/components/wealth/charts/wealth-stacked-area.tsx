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

export type WealthStackedAreaPoint = {
  [key: string]: string | number;
};

/**
 * Stacked area over month / year in the wealth chart chrome.
 * Replaces @nivra/ui StackedAreaChart on wealth pages.
 */
export function WealthStackedArea({
  data,
  series,
  xKey = "year",
  xTick = (v: string | number) => String(v),
  lineOnlyKeys,
  height = "h-[320px] sm:h-[380px]",
}: {
  data: WealthStackedAreaPoint[];
  series: Array<{ key: string; label: string; color: string }>;
  xKey?: string;
  xTick?: (value: string | number) => string;
  /** Keys drawn as a stroke only, not stacked into the area. */
  lineOnlyKeys?: string[];
  height?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const lineOnly = new Set(lineOnlyKeys ?? []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 px-1">
        {series.map((s) => (
          <span
            key={s.key}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <ChartFrame height={height}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {series
                .filter((s) => !lineOnly.has(s.key))
                .map((s) => (
                  <linearGradient key={s.key} id={`${gid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.12} />
                  </linearGradient>
                ))}
            </defs>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => xTick(v as string | number)}
              interval="preserveStartEnd"
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
              lineOnly.has(s.key) ? (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={650 + i * 60}
                />
              ) : (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  fill={`url(#${gid}-${s.key})`}
                  stackId="mix"
                  strokeWidth={2}
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
