"use client";

import { useId } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisINR, formatCompactINR, formatINRCurrency } from "@nivra/ui";
import { ChartFrame, ChartTooltipCard, chartAxisTick } from "./chart-frame";
import { wealthChart } from "../wealth-tokens";

export type WealthComparePoint = {
  category: string;
  [series: string]: string | number;
};

/**
 * Clustered compare bars — same chrome as Goal SIP growth charts
 * (quiet grid, ChartTooltipCard, soft legend). Replaces @nivra/ui CompareChart on wealth pages.
 */
export function WealthCompareBars({
  data,
  series,
  showBarLabels = true,
  height = "h-[320px] sm:h-[380px]",
}: {
  data: WealthComparePoint[];
  series: Array<{ key: string; label: string; color: string }>;
  showBarLabels?: boolean;
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
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <ChartFrame height={height} className="overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 22, right: 12, left: 4, bottom: 8 }}
            barGap={8}
            barCategoryGap="22%"
          >
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="category"
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatAxisINR(Number(v))}
              width={56}
            />
            <Tooltip
              cursor={{ fill: "rgba(15, 23, 42, 0.03)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltipCard
                    label={String(label)}
                    rows={payload.map((p) => ({
                      name: series.find((s) => s.key === p.dataKey)?.label ?? String(p.name),
                      value: Number(p.value ?? 0),
                      color: String(p.color ?? p.fill),
                    }))}
                  />
                );
              }}
            />
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                radius={[6, 6, 2, 2]}
                maxBarSize={48}
                animationDuration={650 + i * 80}
              >
                {showBarLabels ? (
                  <LabelList
                    dataKey={s.key}
                    position="top"
                    formatter={(v: unknown) =>
                      typeof v === "number" && v > 0 ? `₹${formatCompactINR(v)}` : ""
                    }
                    style={{ fill: "#94A3B8", fontSize: 10, fontWeight: 500 }}
                  />
                ) : null}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      {/* keep gid available for future gradient fills */}
      <span className="sr-only" aria-hidden>
        {gid}
      </span>
    </div>
  );
}

export const wealthCompareSeriesDefaults = {
  primary: wealthChart.stepUp,
  secondary: wealthChart.standard,
  tertiary: wealthChart.tax,
} as const;
