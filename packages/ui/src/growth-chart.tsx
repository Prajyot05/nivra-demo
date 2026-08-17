import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactINR } from "./format";

export type GrowthPoint = {
  year: number;
  [series: string]: number;
};

export function GrowthChart({
  data,
  series,
}: {
  data: GrowthPoint[];
  series: Array<{ key: string; label: string; color: string }>;
}) {
  return (
    <div className="h-64 w-full rounded-xl border border-border bg-card p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatCompactINR} tick={{ fontSize: 11 }} width={48} />
          <Tooltip
            formatter={(value) =>
              typeof value === "number" ? formatCompactINR(value) : String(value)
            }
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
