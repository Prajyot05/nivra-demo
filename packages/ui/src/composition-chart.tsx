import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatINRCurrency } from "./format";

export type CompositionSlice = {
  name: string;
  value: number;
  color: string;
};

export function CompositionChart({
  title = "Mix",
  slices,
  centerLabel = "Total",
  centerValue,
  className,
  compact = false,
  showPercentages = false,
  size = "default",
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
}) {
  const large = size === "lg";
  const data = slices.filter((s) => s.value > 0);
  const sliceSum = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const total = centerValue ?? data.reduce((sum, s) => sum + s.value, 0);
  const label = formatINRCurrency(total);
  const len = label.length;
  const corpusFont = large
    ? len > 14
      ? "text-[11px] sm:text-xs"
      : len > 11
        ? "text-xs sm:text-sm"
        : "text-sm sm:text-base"
    : len > 14
      ? "text-[9px] sm:text-[10px]"
      : len > 11
        ? "text-[10px] sm:text-xs"
        : len > 8
          ? "text-xs sm:text-sm"
          : "text-sm sm:text-base";

  const shell = large
    ? `flex h-full min-h-0 flex-1 flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-3.5 ${className ?? ""}`
    : compact
      ? `flex min-h-[210px] flex-none flex-col justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-4 ${className ?? ""}`
      : `flex min-h-[220px] flex-1 flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-2.5 sm:p-3 ${className ?? ""}`;

  const donutBox = large
    ? "relative aspect-square h-[168px] w-[168px] max-w-full shrink-0 sm:h-[184px] sm:w-[184px]"
    : compact
      ? "relative aspect-square h-[170px] w-[170px] max-w-full"
      : "relative aspect-square w-full max-h-[180px] max-w-[180px]";

  return (
    <div className={shell}>
      <div
        className={`shrink-0 font-semibold uppercase tracking-widest text-[var(--app-text-muted)] ${
          large ? "mb-2.5 text-[10px] sm:text-xs" : "mb-2.5 text-[10px] sm:text-xs"
        }`}
      >
        {title}
      </div>
      <div
        className={
          large
            ? "flex min-h-0 flex-1 flex-col items-center justify-center gap-3 sm:flex-row sm:items-center sm:gap-4"
            : "flex min-h-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3"
        }
      >
        <div
          className={
            large
              ? "flex shrink-0 items-center justify-center"
              : "flex shrink-0 items-center justify-center sm:w-[42%] sm:flex-none"
          }
        >
          <div className={donutBox}>
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={large ? "64%" : "65%"}
                  outerRadius={large ? "96%" : "95%"}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex w-[78%] flex-col items-center justify-center overflow-hidden text-center">
                <div
                  className={`font-semibold uppercase tracking-widest text-[var(--app-text-subtle)] ${
                    large ? "text-[10px] sm:text-xs" : "text-[8px] sm:text-[10px]"
                  }`}
                >
                  {centerLabel}
                </div>
                <div
                  className={`mt-0.5 w-full font-semibold leading-tight tabular-nums text-[var(--app-text)] ${corpusFont}`}
                  style={{ wordBreak: "break-all" }}
                >
                  {label}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={
            large
              ? "min-w-0 w-full flex-1 space-y-3.5 sm:w-auto"
              : compact
                ? "min-w-0 flex-1 space-y-1.5 sm:pt-0.5"
                : "custom-scrollbar min-w-0 flex-1 space-y-1.5 overflow-y-auto sm:max-h-[180px] sm:pt-0.5"
          }
        >
          {slices.map((s) => {
            const pct = sliceSum > 0 ? (Math.max(0, s.value) / sliceSum) * 100 : 0;
            const pctLabel =
              pct >= 10 ? pct.toFixed(1) : pct.toFixed(2);
            return (
              <div
                key={s.name}
                className={`flex items-center justify-between ${large ? "gap-3" : "gap-2 text-sm"}`}
              >
                <div className="flex min-w-0 items-center gap-2 text-[var(--app-text-muted)]">
                  <span
                    className={`shrink-0 rounded-full ${large ? "h-2.5 w-2.5" : "h-2 w-2"}`}
                    style={{ backgroundColor: s.color }}
                  />
                  <span
                    className={`truncate font-semibold uppercase tracking-wider ${
                      large ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"
                    }`}
                  >
                    {s.name}
                  </span>
                </div>
                <span
                  className={`shrink-0 text-right font-semibold tabular-nums text-[var(--app-text)] ${
                    large ? "text-xs sm:text-sm" : "text-[11px] font-medium sm:text-xs"
                  }`}
                >
                  {formatINRCurrency(s.value)}
                  {showPercentages && s.value > 0 ? (
                    <span className="ml-1.5 font-medium text-[var(--app-text-subtle)]">
                      ({pctLabel}%)
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
