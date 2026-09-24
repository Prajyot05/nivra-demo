"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisINR } from "@nivra/ui";
import { wealthChart } from "../wealth-tokens";
import { ChartFrame, ChartTooltipCard, chartAxisTick } from "./chart-frame";

export function ContributionReturnsChart({
  stdInvested,
  stdGain,
  stdTax,
  stepInvested,
  stepGain,
  stepTax,
}: {
  stdInvested: number;
  stdGain: number;
  stdTax: number;
  stepInvested: number;
  stepGain: number;
  stepTax: number;
}) {
  const data = [
    {
      path: "Standard",
      invested: stdInvested,
      returns: stdGain,
      tax: stdTax,
    },
    {
      path: "Step-Up",
      invested: stepInvested,
      returns: stepGain,
      tax: stepTax,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 px-1">
        <LegendDot color={wealthChart.invested} label="Invested" />
        <LegendDot color={wealthChart.gain} label="Returns" />
        <LegendDot color={wealthChart.tax} label="Tax" />
      </div>
      <ChartFrame height="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="path"
              tick={{ fill: "#64748B", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={chartAxisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatAxisINR(Number(v))}
              width={52}
            />
            <Tooltip
              cursor={{ fill: "rgba(15,23,42,0.03)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const names: Record<string, string> = {
                  invested: "Invested",
                  returns: "Returns",
                  tax: "Tax",
                };
                return (
                  <ChartTooltipCard
                    label={String(label)}
                    rows={payload.map((p) => ({
                      name: names[String(p.dataKey)] ?? String(p.dataKey),
                      value: Number(p.value ?? 0),
                      color: String(p.color),
                    }))}
                  />
                );
              }}
            />
            <Bar dataKey="invested" stackId="a" fill={wealthChart.invested} />
            <Bar dataKey="returns" stackId="a" fill={wealthChart.gain} />
            <Bar dataKey="tax" stackId="a" fill={wealthChart.tax} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
