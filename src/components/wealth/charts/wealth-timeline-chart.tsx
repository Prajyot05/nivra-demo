"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisINR } from "@nivra/ui";
import { wealthChart } from "../wealth-tokens";
import { ChartFrame, ChartTooltipCard, chartAxisTick } from "./chart-frame";

/** Approximate invested & returns from year-end corpus for display (no new math). */
export function WealthTimelineChart({
  data,
}: {
  data: Array<{
    year: number;
    corpus: number;
    invested: number;
    returns: number;
  }>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 px-1">
        <LegendDot color={wealthChart.stepUp} label="Corpus" />
        <LegendDot color={wealthChart.invested} label="Invested" dashed />
        <LegendDot color={wealthChart.standard} label="Returns" />
      </div>
      <ChartFrame>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                const labels: Record<string, string> = {
                  corpus: "Corpus",
                  invested: "Invested",
                  returns: "Returns",
                };
                return (
                  <ChartTooltipCard
                    label={`Year ${label}`}
                    rows={payload.map((p) => ({
                      name: labels[String(p.dataKey)] ?? String(p.dataKey),
                      value: Number(p.value ?? 0),
                      color: String(p.color),
                    }))}
                  />
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="corpus"
              stroke={wealthChart.stepUp}
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              animationDuration={700}
            />
            <Line
              type="monotone"
              dataKey="invested"
              stroke={wealthChart.invested}
              strokeWidth={1.75}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0 }}
              animationDuration={750}
            />
            <Line
              type="monotone"
              dataKey="returns"
              stroke={wealthChart.standard}
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0 }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

function LegendDot({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
      <span
        className={cnDot(dashed)}
        style={{ background: dashed ? "transparent" : color, borderColor: color }}
      />
      {label}
    </span>
  );
}

function cnDot(dashed?: boolean) {
  return dashed
    ? "h-0 w-3 border-t-2 border-dashed"
    : "h-2 w-2 rounded-full";
}
