import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisINR, formatINRCurrency } from "./format";
import { CARD, CARD_PAD, SECTION_TITLE } from "./tokens";

export type ComboPoint = {
  age: number;
  [series: string]: number;
};

export type ComboAgeMarker = {
  age: number;
  label: string;
  color?: string;
};

/** Columns + line overlay vs age (Financial Health Excel pattern). */
export function ComboChart({
  data,
  bars,
  lines,
  title = "Corpus vs age",
  ageMarkers,
  className,
}: {
  data: ComboPoint[];
  bars: Array<{ key: string; label: string; color: string }>;
  lines: Array<{ key: string; label: string; color: string }>;
  title?: string;
  /** Vertical markers (retirement, major events). */
  ageMarkers?: ComboAgeMarker[];
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[240px] flex-1 flex-col overflow-hidden ${CARD} ${CARD_PAD} ${className ?? ""}`}
    >
      <div className={`mb-2.5 shrink-0 ${SECTION_TITLE}`}>{title}</div>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
                stroke="var(--app-border)"
              />
              <YAxis
                tickFormatter={formatAxisINR}
                tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
                width={48}
                stroke="transparent"
                domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.12) || "auto"]}
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
                formatter={(value, name) => [
                  typeof value === "number" ? formatINRCurrency(value) : String(value),
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: "12px", color: "var(--app-text-muted)" }} />
              {(ageMarkers ?? []).map((marker, index) => (
                <ReferenceLine
                  key={`${marker.age}-${marker.label}`}
                  x={marker.age}
                  stroke={marker.color ?? "var(--app-text-subtle)"}
                  strokeDasharray="4 4"
                  strokeOpacity={0.85}
                  label={{
                    value: marker.label,
                    position: index % 2 === 0 ? "insideTopLeft" : "insideTopRight",
                    fill: "var(--app-text-muted)",
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                />
              ))}
              {bars.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              ))}
              {lines.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  dot={false}
                  strokeWidth={3}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
