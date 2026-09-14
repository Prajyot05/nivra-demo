import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisINR, formatINRCurrency } from "./format";
import { CARD, CARD_PAD, SECTION_TITLE } from "./tokens";

export type StackedAreaPoint = {
  year: number;
  [series: string]: number;
};

export type StackedAreaReferenceLine = {
  x?: number;
  y?: number;
  label?: string;
  color?: string;
};

export function StackedAreaChart({
  data,
  series,
  title = "Over time",
  xTickFormatter,
  className,
  referenceLines,
  /** Keys that should stroke only (no area fill). */
  lineOnlyKeys,
}: {
  data: StackedAreaPoint[];
  series: Array<{ key: string; label: string; color: string }>;
  title?: string;
  /** Custom X-axis tick labels (e.g. Year 5). */
  xTickFormatter?: (value: number) => string;
  className?: string;
  referenceLines?: StackedAreaReferenceLine[];
  lineOnlyKeys?: string[];
}) {
  const n = data.length;
  const lineOnly = new Set(lineOnlyKeys ?? []);
  return (
    <div
      className={`flex min-h-[240px] flex-1 flex-col overflow-hidden ${CARD} ${CARD_PAD} ${className ?? ""}`}
    >
      <div className={`mb-2.5 shrink-0 ${SECTION_TITLE}`}>
        {title}
      </div>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
                stroke="var(--app-border)"
                tickFormatter={xTickFormatter}
                interval={n <= 16 ? 0 : "preserveStartEnd"}
              />
              <YAxis
                tickFormatter={formatAxisINR}
                tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
                width={48}
                stroke="transparent"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--app-surface)",
                  borderColor: "var(--app-border)",
                  borderRadius: "8px",
                  color: "var(--app-text)",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                itemStyle={{ fontWeight: 600 }}
                labelFormatter={(label) =>
                  xTickFormatter && typeof label === "number"
                    ? xTickFormatter(label)
                    : `Age ${label}`
                }
                formatter={(value, name) => [
                  typeof value === "number" ? formatINRCurrency(value) : String(value),
                  name,
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{
                  fontSize: "12px",
                  color: "var(--app-text-muted)",
                  paddingTop: 8,
                }}
              />
              {(referenceLines ?? []).map((line) => {
                const hasX = line.x != null && Number.isFinite(line.x);
                const hasY = line.y != null && Number.isFinite(line.y);
                if (!hasX && !hasY) return null;
                return (
                  <ReferenceLine
                    key={`${hasX ? `x-${line.x}` : `y-${line.y}`}-${line.label ?? ""}`}
                    x={hasX ? line.x : undefined}
                    y={hasY ? line.y : undefined}
                    stroke={line.color ?? "var(--app-text-subtle)"}
                    strokeDasharray="4 4"
                    strokeOpacity={0.85}
                    label={
                      line.label
                        ? {
                            value: line.label,
                            position: hasX ? "insideTopLeft" : "insideTopRight",
                            fill: "var(--app-text-muted)",
                            fontSize: 10,
                            fontWeight: 600,
                          }
                        : undefined
                    }
                  />
                );
              })}
              {series.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={lineOnly.has(s.key) ? 0 : 0.35}
                  stackId={lineOnly.has(s.key) ? undefined : "mix"}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
