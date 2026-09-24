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

const VOID_PATTERN_ID = "wealth-waterfall-void";

/**
 * Waterfall build-up chart using the same ChartFrame chrome as WealthCompareBars.
 * Offset (carried-forward) space uses a soft slate hatch so Additional sits clearly
 * above Existing credit.
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

  const hasVoid = data.some((row) => row.offset > 0);

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
        {hasVoid ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
            <span
              className="inline-block h-2.5 w-4 rounded-sm border border-slate-300"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, #F8FAFC, #F8FAFC 2px, #CBD5E1 2px, #CBD5E1 3.5px)",
              }}
              aria-hidden
            />
            Carried forward
          </span>
        ) : null}
      </div>
      <ChartFrame height={height} className="overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 22, right: 12, left: 4, bottom: 8 }}
            barCategoryGap="28%"
          >
            <defs>
              <pattern
                id={VOID_PATTERN_ID}
                width="7"
                height="7"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="7" height="7" fill="#F8FAFC" />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="7"
                  stroke="#CBD5E1"
                  strokeWidth="2.5"
                />
              </pattern>
            </defs>
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
                  (row?.payload as { signed?: number } | undefined)?.signed ??
                    row?.value ??
                    0,
                );
                return (
                  <ChartTooltipCard
                    label={String(label)}
                    rows={[
                      {
                        name: "Amount",
                        value: signed,
                        color:
                          (row?.payload as { kind?: string } | undefined)?.kind ===
                          "total"
                            ? wealthChart.stepUp
                            : wealthChart.invested,
                      },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="offset" stackId="wf" maxBarSize={48}>
              {data.map((row) => (
                <Cell
                  key={`${row.category}-offset`}
                  fill={
                    row.offset > 0 ? `url(#${VOID_PATTERN_ID})` : "transparent"
                  }
                  stroke={row.offset > 0 ? "#E2E8F0" : "transparent"}
                  strokeWidth={row.offset > 0 ? 1 : 0}
                />
              ))}
            </Bar>
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
        Build-up to target · values shown as {formatINRCurrency(running)} at the
        final step
      </p>
    </div>
  );
}
