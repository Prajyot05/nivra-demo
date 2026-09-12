"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import { formatINRCurrency, formatPercent } from "./format";
import { CARD, CARD_PAD, SECTION_TITLE } from "./tokens";

export type CompositionSlice = {
  name: string;
  value: number;
  color: string;
};

function ActiveSlice(props: {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
}) {
  const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0, startAngle = 0, endAngle = 0, fill } =
    props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={Math.max(0, innerRadius - 2)}
      outerRadius={outerRadius + 3}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      cornerRadius={4}
      stroke="var(--app-surface)"
      strokeWidth={2}
    />
  );
}

export function CompositionChart({
  title = "Mix",
  slices,
  centerLabel = "Total",
  centerValue,
  className,
  compact = false,
  showPercentages = false,
  size = "default",
  /** Thin ring stroke like Periodic / capital-paid gauge. Default on for all donuts. */
  thinRing = true,
}: {
  title?: string;
  slices: CompositionSlice[];
  centerLabel?: string;
  centerValue?: number;
  className?: string;
  /** Tighter vertical footprint — less empty space above/below the donut. */
  compact?: boolean;
  showPercentages?: boolean;
  /** Larger donut + legend (side panel aligned with growth chart). */
  size?: "default" | "lg";
  thinRing?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const large = size === "lg";
  const data = slices.filter((s) => s.value > 0);
  const sliceSum = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const total = centerValue ?? data.reduce((sum, s) => sum + s.value, 0);
  const label = formatINRCurrency(total);
  const len = label.length;
  const corpusFont = large
    ? len > 14
      ? "text-xs sm:text-sm"
      : len > 11
        ? "text-sm sm:text-base"
        : "text-base sm:text-lg"
    : len > 14
      ? "text-[10px] sm:text-xs"
      : len > 11
        ? "text-xs sm:text-sm"
        : len > 8
          ? "text-sm sm:text-base"
          : "text-base sm:text-lg";

  // Donut + legend sit side by side only when the card itself is wide enough.
  // Viewport breakpoints lie here: these cards are often in a narrow column.
  const shell = large
    ? `@container flex h-full min-h-0 flex-1 flex-col ${CARD} ${CARD_PAD} ${className ?? ""}`
    : compact
      ? `@container flex min-h-[230px] flex-none flex-col justify-center ${CARD} ${CARD_PAD} ${className ?? ""}`
      : `@container flex min-h-[260px] flex-1 flex-col ${CARD} ${CARD_PAD} ${className ?? ""}`;

  const donutBox = large
    ? "relative aspect-square h-[168px] w-[168px] max-w-full shrink-0 sm:h-[184px] sm:w-[184px]"
    : compact
      ? "relative aspect-square h-[170px] w-[170px] max-w-full"
      : "relative aspect-square h-[176px] w-[176px] max-w-full";

  const innerRadius = thinRing ? (large ? "74%" : "72%") : large ? "58%" : "56%";
  const outerRadius = thinRing ? (large ? "90%" : "88%") : large ? "94%" : "92%";

  return (
    <div className={shell}>
      <div className={`mb-2.5 shrink-0 ${SECTION_TITLE}`}>{title}</div>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-4 @sm:flex-row @sm:items-center @sm:gap-5">
        <div className="flex shrink-0 items-center justify-center overflow-visible">
          <div className={`${donutBox} overflow-visible`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  paddingAngle={2}
                  stroke="var(--app-surface)"
                  strokeWidth={2}
                  cornerRadius={thinRing ? 8 : 4}
                  isAnimationActive
                  animationDuration={500}
                  activeIndex={activeIndex}
                  activeShape={ActiveSlice}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ zIndex: 40, outline: "none", pointerEvents: "none" }}
                  offset={12}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0];
                    const value = Number(row.value ?? 0);
                    const pct = sliceSum > 0 ? (value / sliceSum) * 100 : 0;
                    return (
                      <div className="relative z-50 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs shadow-lg">
                        <div className="font-semibold text-[var(--app-text)]">{String(row.name)}</div>
                        <div className="mt-1 tabular-nums font-semibold text-[var(--app-step-text)]">
                          {formatINRCurrency(value)}
                        </div>
                        <div className="mt-0.5 text-[var(--app-text-muted)]">
                          {formatPercent(pct, 1)} of mix
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div
              className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity ${
                activeIndex != null ? "opacity-0" : "opacity-100"
              }`}
            >
              {/* Keep the centre label inside the ring hole (innerRadius above). */}
              <div
                className={`flex flex-col items-center justify-center overflow-hidden text-center ${
                  thinRing ? "w-[68%]" : "w-[54%]"
                }`}
              >
                <div
                  className={`w-full font-bold leading-tight tabular-nums text-[var(--app-text)] ${corpusFont}`}
                  style={{ wordBreak: "break-all" }}
                >
                  {label}
                </div>
                <div
                  className={`mt-0.5 font-semibold uppercase tracking-widest text-[var(--app-text-subtle)] ${
                    large ? "text-[10px] sm:text-xs" : "text-[9px] sm:text-[10px]"
                  }`}
                >
                  {centerLabel}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="custom-scrollbar min-w-0 w-full flex-1 space-y-2.5 sm:max-h-none">
          {slices.map((s) => {
            const pct = sliceSum > 0 ? (Math.max(0, s.value) / sliceSum) * 100 : 0;
            const pctLabel = pct >= 10 ? pct.toFixed(1) : pct.toFixed(2);
            return (
              <div
                key={s.name}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5"
              >
                <div className="flex min-w-0 items-center gap-2 text-[var(--app-text-muted)]">
                  <span
                    className={`shrink-0 rounded-full ${large ? "h-2.5 w-2.5" : "h-2 w-2"}`}
                    style={{ backgroundColor: s.color }}
                  />
                  <span
                    className={`min-w-0 font-medium leading-tight ${
                      large ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs"
                    }`}
                  >
                    {s.name}
                  </span>
                </div>
                <div
                  className={`whitespace-nowrap text-right tabular-nums font-semibold text-[var(--app-text)] ${
                    large ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs"
                  }`}
                >
                  {formatINRCurrency(s.value)}
                </div>
                {showPercentages && s.value > 0 ? (
                  <div className="col-span-2 pl-4 text-[10px] text-[var(--app-text-subtle)] sm:pl-5">
                    {pctLabel}% of mix
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
