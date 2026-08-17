import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactINR, formatINRCurrency } from "./format";

export type StackedBarPoint = {
  category: string;
  [series: string]: string | number;
};

export function StackedBarChart({
  data,
  series,
  title = "Breakdown",
  className,
}: {
  data: StackedBarPoint[];
  series: Array<{ key: string; label: string; color: string }>;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full flex-1 flex-col overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4 ${className ?? "min-h-[300px]"}`}
    >
      <div className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        {title}
      </div>
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
              stroke="var(--app-border)"
              interval={0}
              angle={data.length > 8 ? -35 : 0}
              textAnchor={data.length > 8 ? "end" : "middle"}
              height={data.length > 8 ? 64 : 30}
            />
            <YAxis
              tickFormatter={formatCompactINR}
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
              formatter={(value, name) => [
                typeof value === "number" ? formatINRCurrency(value) : String(value),
                name,
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "var(--app-text-muted)" }}
            />
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                stackId="stack"
                maxBarSize={36}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
