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
}: {
  title?: string;
  slices: CompositionSlice[];
  centerLabel?: string;
  centerValue?: number;
}) {
  const data = slices.filter((s) => s.value > 0);
  const total = centerValue ?? data.reduce((sum, s) => sum + s.value, 0);
  const label = formatINRCurrency(total);
  const len = label.length;
  const corpusFont =
    len > 14
      ? "text-[10px] sm:text-xs"
      : len > 11
        ? "text-xs sm:text-sm"
        : len > 8
          ? "text-sm sm:text-base"
          : "text-base sm:text-lg";

  return (
    <div className="flex h-[300px] shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4">
      <div className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        {title}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex min-h-0 flex-1 items-center justify-center py-1">
          <div className="relative aspect-square w-full max-w-[180px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="65%"
                  outerRadius="95%"
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
                <div className="text-[8px] font-semibold uppercase tracking-widest text-[var(--app-text-subtle)] sm:text-[10px]">
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
        <div className="mt-2 space-y-1.5">
          {slices.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex min-w-0 items-center gap-2 text-[var(--app-text-muted)]">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate text-[10px] font-semibold uppercase tracking-wider sm:text-xs">
                  {s.name}
                </span>
              </div>
              <span className="shrink-0 text-right text-xs font-medium tabular-nums text-[var(--app-text)] sm:text-sm">
                {formatINRCurrency(s.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
