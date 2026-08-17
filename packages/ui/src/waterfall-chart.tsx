import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactINR, formatINRCurrency } from "./format";

export type WaterfallStep = {
  label: string;
  value: number;
  kind?: "increase" | "decrease" | "total";
};

export function WaterfallChart({
  title = "Build-up",
  steps,
}: {
  title?: string;
  steps: WaterfallStep[];
}) {
  let running = 0;
  const data = steps.map((step) => {
    const kind = step.kind ?? "increase";
    const amount = step.value;
    let offset = 0;
    if (kind === "increase") {
      offset = running;
      running += amount;
    } else if (kind === "decrease") {
      running -= amount;
      offset = running;
    } else {
      offset = 0;
      running = amount;
    }
    return {
      category: step.label,
      offset,
      amount: Math.abs(amount),
      kind,
      signed: amount,
    };
  });

  return (
    <div className="flex h-full min-h-[300px] flex-1 flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        {title}
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
              stroke="var(--app-border)"
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
              formatter={(value, name, item) => {
                if (name === "offset") return [null, undefined];
                const signed = (item?.payload as { signed?: number } | undefined)?.signed;
                return [
                  typeof signed === "number" ? formatINRCurrency(signed) : String(value),
                  "Amount",
                ];
              }}
            />
            <Bar dataKey="offset" stackId="wf" fill="transparent" maxBarSize={48} legendType="none" tooltipType="none" />
            <Bar dataKey="amount" stackId="wf" maxBarSize={48} radius={[4, 4, 0, 0]}>
              {data.map((row) => (
                <Cell
                  key={row.category}
                  fill={
                    row.kind === "total"
                      ? "var(--app-chart-invested)"
                      : row.kind === "decrease"
                        ? "var(--app-chart-tax)"
                        : "var(--app-chart-gain)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
