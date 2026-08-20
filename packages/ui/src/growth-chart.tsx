import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactINR, formatINRCurrency } from "./format";

export type GrowthPoint = {
  year: number;
  [series: string]: number;
};

export function GrowthChart({
  data,
  series,
  title = "Corpus Growth",
}: {
  data: GrowthPoint[];
  series: Array<{ key: string; label: string; color: string }>;
  title?: string;
}) {
  return (
    <div className="flex h-[300px] shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4">
      <div className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        {title}
      </div>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--app-text-muted)" }} stroke="var(--app-border)" />
            <YAxis tickFormatter={formatCompactINR} tick={{ fontSize: 11, fill: "var(--app-text-muted)" }} width={48} stroke="transparent" />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)", borderRadius: "8px", color: "var(--app-text)", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
              itemStyle={{ fontWeight: 600 }}
              formatter={(value, name) => [
                typeof value === "number" ? formatINRCurrency(value) : String(value),
                name,
              ]}
            />
            <Legend wrapperStyle={{ fontSize: "12px", color: "var(--app-text-muted)" }} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                dot={false}
                strokeWidth={3}
                activeDot={{ r: 6, fill: s.color, stroke: "var(--app-surface)", strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
