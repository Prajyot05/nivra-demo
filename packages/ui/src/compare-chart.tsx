import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactINR, formatINRCurrency } from "./format";

export type ComparePoint = {
  category: string;
  /** Optional secondary tick line (e.g. goal names under age). */
  sublabel?: string;
  /** Optional per-bar fill override. */
  fill?: string;
  /** Optional withdrawal total for tooltip context. */
  withdrawal?: number;
  [series: string]: string | number | undefined;
};

function DualLineTick({
  x,
  y,
  payload,
  data,
  maxSubChars,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string | number; index?: number };
  data: ComparePoint[];
  maxSubChars: number;
}) {
  const index = typeof payload?.index === "number" ? payload.index : -1;
  const point = index >= 0 ? data[index] : undefined;
  const label = String(payload?.value ?? "");
  const sub = point?.sublabel;
  const cx = x ?? 0;
  const cy = y ?? 0;
  let subShort: string | undefined;
  if (sub) {
    const parts = sub.split(" + ").filter(Boolean);
    if (parts.length > 1 && sub.length > maxSubChars) {
      subShort = `${parts.length} goals`;
    } else if (sub.length > maxSubChars) {
      subShort = `${sub.slice(0, Math.max(4, maxSubChars - 1))}…`;
    } else {
      subShort = sub;
    }
  }

  return (
    <g transform={`translate(${cx},${cy})`}>
      <text
        dy={12}
        textAnchor="middle"
        fill="var(--app-text-muted)"
        style={{ fontSize: 11, fontWeight: 600 }}
      >
        {label}
      </text>
      {subShort ? (
        <text dy={26} textAnchor="middle" fill="var(--app-text-subtle)" style={{ fontSize: 9 }}>
          {subShort}
        </text>
      ) : null}
    </g>
  );
}

export function CompareChart({
  data,
  series,
  title = "Compare",
  className,
  showBarLabels = false,
  angledLabels = false,
  showLegend,
}: {
  data: ComparePoint[];
  series: Array<{ key: string; label: string; color: string }>;
  title?: string;
  className?: string;
  /** Compact INR labels above each bar. */
  showBarLabels?: boolean;
  /** Rotate category ticks for longer goal labels. */
  angledLabels?: boolean;
  /** Defaults to true only when there are multiple series. */
  showLegend?: boolean;
}) {
  const useCells = data.some((d) => typeof d.fill === "string");
  const hasSublabels = data.some((d) => typeof d.sublabel === "string" && d.sublabel.length > 0);
  /** Many bars: keep axis to age only; goal names live in the tooltip. */
  const dense = data.length >= 7;
  const showAxisSublabels = hasSublabels && !dense && !angledLabels;
  const useAngled = angledLabels || dense;
  const showLabels = showBarLabels && data.length <= 10;
  const maxSubChars = data.length >= 5 ? 14 : 22;
  const legendVisible = showLegend ?? series.length > 1;

  const hasFixedHeight =
    Boolean(className?.includes("min-h-")) || Boolean(className?.includes("h-["));

  return (
    <div
      className={`flex w-full flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4 ${
        hasFixedHeight ? "" : "min-h-[320px] sm:min-h-[340px]"
      } ${className ?? ""}`}
    >
      <div className="mb-2.5 shrink-0 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        {title}
      </div>
      {dense && hasSublabels ? (
        <p className="mb-2 shrink-0 text-[11px] text-[var(--app-text-subtle)]">
          Hover a bar for goal names and withdrawal amount.
        </p>
      ) : null}
      <div className="relative min-h-0 w-full flex-1">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: showLabels ? 28 : 16,
                right: 12,
                left: 0,
                // XAxis.height already reserves room for angled ticks. Extra bottom
                // margin here stacked empty space under the labels.
                bottom: useAngled ? 4 : showAxisSublabels ? 8 : 4,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
              <XAxis
                dataKey="category"
                tick={
                  showAxisSublabels
                    ? (props) => <DualLineTick {...props} data={data} maxSubChars={maxSubChars} />
                    : { fontSize: useAngled ? 10 : 11, fill: "var(--app-text-muted)" }
                }
                stroke="var(--app-border)"
                interval={0}
                angle={useAngled ? -35 : 0}
                textAnchor={useAngled ? "end" : "middle"}
                height={useAngled ? 48 : showAxisSublabels ? 42 : 28}
                minTickGap={dense ? 2 : 8}
              />
              <YAxis
                tickFormatter={(v) => `₹${formatCompactINR(Number(v))}`}
                tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
                width={52}
                stroke="transparent"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0]?.payload as ComparePoint | undefined;
                  return (
                    <div className="max-w-[16rem] rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs shadow-md">
                      <div className="font-semibold text-[var(--app-text)]">{String(label)}</div>
                      {point?.sublabel ? (
                        <div className="mt-0.5 leading-snug text-[var(--app-text-muted)]">
                          {point.sublabel}
                        </div>
                      ) : null}
                      {payload.map((entry) => (
                        <div
                          key={String(entry.dataKey)}
                          className="mt-1.5 tabular-nums font-semibold text-[var(--app-step-text)]"
                        >
                          {entry.name}:{" "}
                          {typeof entry.value === "number"
                            ? formatINRCurrency(entry.value)
                            : String(entry.value)}
                        </div>
                      ))}
                      {typeof point?.withdrawal === "number" && point.withdrawal > 0 ? (
                        <div className="mt-1 tabular-nums text-[var(--app-danger)]">
                          Withdrawal: {formatINRCurrency(point.withdrawal)}
                        </div>
                      ) : null}
                    </div>
                  );
                }}
              />
              {legendVisible ? (
                <Legend wrapperStyle={{ fontSize: "12px", color: "var(--app-text-muted)" }} />
              ) : null}
              {series.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={dense ? 40 : 64}
                >
                  {useCells
                    ? data.map((d, i) => (
                        <Cell key={`${s.key}-${i}`} fill={typeof d.fill === "string" ? d.fill : s.color} />
                      ))
                    : null}
                  {showLabels ? (
                    <LabelList
                      dataKey={s.key}
                      position="top"
                      formatter={(v: number | string) =>
                        typeof v === "number" ? `₹${formatCompactINR(v)}` : ""
                      }
                      style={{ fontSize: 9, fill: "var(--app-text-muted)", fontWeight: 600 }}
                    />
                  ) : null}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
