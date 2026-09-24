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
import { ChartFrame, chartAxisTick } from "./chart-frame";

export type WealthStackedPoint = {
  category: string;
  [series: string]: string | number;
};

/**
 * Stacked columns or horizontal bars in the wealth chart chrome.
 * Replaces @nivra/ui StackedBarChart on wealth pages.
 */
export function WealthStackedBars({
  data,
  series,
  orientation = "vertical",
  totalLabel,
  height,
}: {
  data: WealthStackedPoint[];
  series: Array<{ key: string; label: string; color: string }>;
  orientation?: "vertical" | "horizontal";
  /** Tooltip footer when summing the stack (e.g. "Total withdrawal"). */
  totalLabel?: string;
  height?: string;
}) {
  const horizontal = orientation === "horizontal";
  const frameHeight =
    height ??
    (horizontal
      ? data.length > 10
        ? "h-[min(70vh,520px)]"
        : "h-[280px]"
      : "h-[320px] sm:h-[380px]");
  const yAxisWidth = horizontal
    ? Math.min(120, Math.max(64, ...data.map((d) => String(d.category).length * 6.5)))
    : 56;
  const stackMax = Math.max(
    1,
    ...data.map((row) => series.reduce((sum, item) => sum + Number(row[item.key] ?? 0), 0)),
  );

  if (horizontal) {
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
        <ChartFrame height={frameHeight} className="overflow-hidden">
          <div className="custom-scrollbar flex h-full flex-col justify-center gap-2.5 overflow-y-auto pr-1">
            {data.map((row) => (
              <div
                key={row.category}
                className="grid grid-cols-[minmax(4.5rem,7.5rem)_1fr_auto] items-center gap-3"
              >
                <span className="truncate text-[11px] font-medium text-slate-500">{row.category}</span>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                  {series.map((item) => {
                    const value = Number(row[item.key] ?? 0);
                    if (value <= 0) return null;
                    return (
                      <div
                        key={item.key}
                        className="h-full first:rounded-l-full last:rounded-r-full"
                        style={{
                          width: `${(value / stackMax) * 100}%`,
                          background: item.color,
                        }}
                        title={`${item.label}: ${formatINRCurrency(value)}`}
                      />
                    );
                  })}
                </div>
                <span className="text-[11px] font-semibold tabular-nums text-slate-700">
                  {formatINRCurrency(
                    series.reduce((sum, item) => sum + Number(row[item.key] ?? 0), 0),
                  )}
                </span>
              </div>
            ))}
          </div>
        </ChartFrame>
      </div>
    );
  }

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
      <ChartFrame height={frameHeight} className="overflow-hidden">
        {/* Absolute fill so Recharts measures a real box inside AnimatePresence tabs. */}
        <div className="relative h-full min-h-0 w-full">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout={horizontal ? "vertical" : "horizontal"}
                margin={
                  horizontal
                    ? { top: 8, right: 16, left: 4, bottom: 4 }
                    : { top: 12, right: 12, left: 4, bottom: 8 }
                }
                barCategoryGap={horizontal ? "12%" : "22%"}
              >
                <CartesianGrid
                  stroke="#F1F5F9"
                  horizontal={!horizontal}
                  vertical={horizontal}
                />
                {horizontal ? (
                  <>
                    <XAxis
                      type="number"
                      tick={chartAxisTick}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatAxisINR(Number(v))}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={yAxisWidth}
                      tick={chartAxisTick}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                  </>
                ) : (
                  <>
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
                  </>
                )}
                <Tooltip
                  cursor={{ fill: "rgba(15, 23, 42, 0.03)" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const rows = payload.map((p) => ({
                      name: series.find((s) => s.key === p.dataKey)?.label ?? String(p.name),
                      value: Number(p.value ?? 0),
                      color: String(p.color ?? p.fill ?? "#64748B"),
                    }));
                    const total = rows.reduce((sum, row) => sum + row.value, 0);
                    return (
                      <div className="min-w-[160px] rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.10)]">
                        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                          {String(label)}
                        </div>
                        <div className="mt-2 space-y-1.5">
                          {rows.map((row) => (
                            <div
                              key={row.name}
                              className="flex items-center justify-between gap-4 text-xs"
                            >
                              <span className="inline-flex items-center gap-1.5 text-slate-600">
                                <span
                                  className="h-2 w-2 rounded-sm"
                                  style={{ background: row.color }}
                                />
                                {row.name}
                              </span>
                              <span className="font-semibold tabular-nums text-slate-900">
                                {formatINRCurrency(row.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {totalLabel ? (
                          <div className="mt-2 flex items-center justify-between gap-4 border-t border-slate-100 pt-2 text-xs">
                            <span className="text-slate-500">{totalLabel}</span>
                            <span className="font-semibold tabular-nums text-slate-900">
                              {formatINRCurrency(total)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    );
                  }}
                />
                {series.map((s, index) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    fill={s.color}
                    stackId="stack"
                    maxBarSize={horizontal ? 22 : 48}
                    radius={
                      index === series.length - 1
                        ? horizontal
                          ? [0, 6, 6, 0]
                          : [6, 6, 0, 0]
                        : [0, 0, 0, 0]
                    }
                    animationDuration={650 + index * 80}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartFrame>
    </div>
  );
}
