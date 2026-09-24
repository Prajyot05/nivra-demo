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
import { formatAxisINR, formatINRCurrency } from "@nivra/ui";
import { wealthChart } from "../wealth-tokens";
import { ChartFrame, ChartTooltipCard, chartAxisTick } from "./chart-frame";

export function SipEscalationChart({
  data,
  startSip,
  endSip,
}: {
  data: Array<{ year: number; sip: number }>;
  startSip: number;
  endSip: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium tabular-nums text-slate-600">
          Start · {formatINRCurrency(startSip)}
        </span>
        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium tabular-nums text-emerald-700">
          End · {formatINRCurrency(endSip)}
        </span>
      </div>
      <ChartFrame height="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              width={48}
            />
            <Tooltip
              cursor={{ fill: "rgba(15,23,42,0.03)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltipCard
                    label={`Year ${label}`}
                    rows={[
                      {
                        name: "Monthly SIP",
                        value: Number(payload[0]?.value ?? 0),
                        color: wealthChart.stepUp,
                      },
                    ]}
                  />
                );
              }}
            />
            <Bar
              dataKey="sip"
              fill={wealthChart.stepUp}
              radius={[6, 6, 2, 2]}
              animationDuration={650}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}
