"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisINR, formatINRCurrency } from "@nivra/ui";
import { ChartFrame, ChartTooltipCard, chartAxisTick } from "./chart-frame";
import { wealthChart } from "../wealth-tokens";

export type WealthWaterfallStep = {
  label: string;
  value: number;
  kind?: "increase" | "decrease" | "total";
};

/**
 * Waterfall build-up chart using the same ChartFrame chrome as WealthCompareBars.
 */
export function WealthWaterfallBars({
  steps,
  height = "h-[300px] sm:h-[340px]",
}: {
  steps: WealthWaterfallStep[];
  height?: string;
}) {
  let running = 0;
  const data = steps.map((step) => {
    const kind = step.kind ?? "increase";
    const amount = step.value;
    let offset = 0;
    if (kind === "increase") {
      offset = running;
      running += amount;
    } else if (kind === "decrease") {
      running -= amount;
      offset = running;
    } else {
      offset = 0;
      running = amount;
    }
    return {
      category: step.label,
      offset,
      amount: Math.abs(amount),
      kind,
      signed: amount,
    };
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4 px-1">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ background: wealthChart.invested }} />
          Credit / add
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ background: wealthChart.stepUp }} />
          Target
        </span>
      </div>
      <ChartFrame height={height} className="overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 22, right: 12, left: 4, bottom: 8 }}
            barCategoryGap="28%"
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
                const row = payload.find((p) => p.dataKey === "amount");
                const signed = Number(
                  (row?.payload as { signed?: number } | undefined)?.signed ?? row?.value ?? 0,
                );
                return (
                  <ChartTooltipCard
                    label={String(label)}
                    rows={[
                      {
                        name: "Amount",
                        value: signed,
                        color:
                          (row?.payload as { kind?: string } | undefined)?.kind === "total"
                            ? wealthChart.stepUp
                            : wealthChart.invested,
                      },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="offset" stackId="wf" fill="transparent" maxBarSize={48} />
            <Bar dataKey="amount" stackId="wf" radius={[6, 6, 2, 2]} maxBarSize={48}>
              {data.map((row) => (
                <Cell
                  key={row.category}
                  fill={
                    row.kind === "total"
                      ? wealthChart.stepUp
                      : row.kind === "decrease"
                        ? wealthChart.tax
                        : wealthChart.invested
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <p className="px-1 text-[11px] text-slate-400">
        Build-up to target · values shown as {formatINRCurrency(running)} at the final step
      </p>
    </div>
  );
}
