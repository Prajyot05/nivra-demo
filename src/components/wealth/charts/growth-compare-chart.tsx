"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisINR } from "@nivra/ui";
import { wealthChart } from "../wealth-tokens";
import { ChartFrame, ChartTooltipCard, chartAxisTick } from "./chart-frame";

export function GrowthCompareChart({
  data,
}: {
  data: Array<{ year: number; standard: number; stepUp: number }>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 px-1">
        <LegendDot color={wealthChart.standard} label="Standard SIP" />
        <LegendDot color={wealthChart.stepUp} label="Step-Up SIP" />
      </div>
      <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="wealthStdFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={wealthChart.standard} stopOpacity={0.18} />
                <stop offset="100%" stopColor={wealthChart.standard} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="wealthStepFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={wealthChart.stepUp} stopOpacity={0.22} />
                <stop offset="100%" stopColor={wealthChart.stepUp} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="year"
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `Y${v}`}
            />
            <YAxis
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatAxisINR(Number(v))}
              width={52}
            />
            <Tooltip
              cursor={{ stroke: "#CBD5E1", strokeDasharray: "4 4" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltipCard
                    label={`Year ${label}`}
                    rows={payload.map((p) => ({
                      name: p.dataKey === "standard" ? "Standard SIP" : "Step-Up SIP",
                      value: Number(p.value ?? 0),
                      color: String(p.color),
                    }))}
                  />
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="standard"
              stroke={wealthChart.standard}
              fill="url(#wealthStdFill)"
              strokeWidth={2}
              animationDuration={700}
            />
            <Area
              type="monotone"
              dataKey="stepUp"
              stroke={wealthChart.stepUp}
              fill="url(#wealthStepFill)"
              strokeWidth={2.25}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
