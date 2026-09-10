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

const VOID_PATTERN_ID = "nivra-waterfall-void";

export function WaterfallChart({
  title = "Build-up",
  steps,
  className,
}: {
  title?: string;
  steps: WaterfallStep[];
  className?: string;
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

  const hasVoid = data.some((row) => row.offset > 0);
  const hasFixedHeight =
    Boolean(className?.includes("min-h-")) || Boolean(className?.includes("h-["));

  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-4 ${
        hasFixedHeight ? "" : "min-h-[320px] flex-1 sm:min-h-[340px]"
      } ${className ?? ""}`}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
          {title}
        </div>
        {hasVoid ? (
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--app-text-muted)]">
            <span
              className="inline-block h-2.5 w-4 rounded-sm border border-[var(--app-border)]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, var(--app-surface-muted), var(--app-surface-muted) 2px, var(--app-border) 2px, var(--app-border) 3.5px)",
              }}
              aria-hidden
            />
            Carried forward
          </div>
        ) : null}
      </div>
      <div className="relative min-h-0 w-full flex-1">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="28%">
              <defs>
                <pattern
                  id={VOID_PATTERN_ID}
                  width="7"
                  height="7"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="7" height="7" fill="var(--app-surface-muted)" />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="7"
                    stroke="var(--app-border)"
                    strokeWidth="2.5"
                  />
                </pattern>
              </defs>
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
                  if (name === "offset") {
                    const offset = Number(value);
                    if (!offset) return [null, undefined];
                    return [formatINRCurrency(offset), "Carried forward"];
                  }
                  const signed = (item?.payload as { signed?: number } | undefined)?.signed;
                  return [
                    typeof signed === "number" ? formatINRCurrency(signed) : String(value),
                    "Amount",
                  ];
                }}
              />
              <Bar dataKey="offset" stackId="wf" maxBarSize={56} legendType="none">
                {data.map((row) => (
                  <Cell
                    key={`offset-${row.category}`}
                    fill={row.offset > 0 ? `url(#${VOID_PATTERN_ID})` : "transparent"}
                    stroke={row.offset > 0 ? "var(--app-border)" : "transparent"}
                    strokeWidth={row.offset > 0 ? 1 : 0}
                  />
                ))}
              </Bar>
              <Bar dataKey="amount" stackId="wf" maxBarSize={56} radius={[4, 4, 0, 0]}>
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
    </div>
  );
}

