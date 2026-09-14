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
import { formatAxisINR, formatINRCurrency } from "./format";
import { CARD, CARD_PAD, SECTION_TITLE } from "./tokens";

export type StackedBarPoint = {
  category: string;
  [series: string]: string | number;
};

/**
 * Stacked columns (default) or horizontal bars (`orientation="horizontal"`).
 * Horizontal mode keeps long category labels readable without rotation.
 */
export function StackedBarChart({
  data,
  series,
  title = "Breakdown",
  className,
  orientation = "vertical",
  totalLabel,
}: {
  data: StackedBarPoint[];
  series: Array<{ key: string; label: string; color: string }>;
  title?: string;
  className?: string;
  /** `vertical` = classic columns; `horizontal` = bars growing right. */
  orientation?: "vertical" | "horizontal";
  /** Optional tooltip footer label when summing series (e.g. "Total withdrawal"). */
  totalLabel?: string;
}) {
  const hasFixedHeight =
    Boolean(className?.includes("min-h-")) || Boolean(className?.includes("h-["));
  const horizontal = orientation === "horizontal";
  const yAxisWidth = horizontal
    ? Math.min(96, Math.max(56, ...data.map((d) => String(d.category).length * 6.5)))
    : 48;

  return (
    <div
      className={`flex w-full flex-col overflow-hidden ${CARD} ${CARD_PAD} ${
        hasFixedHeight ? "" : "min-h-[240px] flex-1"
      } ${className ?? ""}`}
    >
      <div className={`mb-2.5 shrink-0 ${SECTION_TITLE}`}>{title}</div>
      <div className="relative min-h-0 w-full flex-1">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout={horizontal ? "vertical" : "horizontal"}
              margin={
                horizontal
                  ? { top: 8, right: 16, left: 4, bottom: 0 }
                  : { top: 8, right: 12, left: 0, bottom: 0 }
              }
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--app-border)"
                horizontal={!horizontal}
                vertical={horizontal}
                opacity={0.55}
              />
              {horizontal ? (
                <>
                  <XAxis
                    type="number"
                    tickFormatter={formatAxisINR}
                    tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
                    stroke="transparent"
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={yAxisWidth}
                    tick={{ fontSize: 10, fill: "var(--app-text-muted)" }}
                    stroke="var(--app-border)"
                    interval={0}
                  />
                </>
              ) : (
                <>
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
                    tickFormatter={formatAxisINR}
                    tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
                    width={48}
                    stroke="transparent"
                  />
                </>
              )}
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
                labelFormatter={(label, payload) => {
                  if (!totalLabel || !payload?.length) return String(label);
                  const total = payload.reduce(
                    (sum, item) => sum + (typeof item.value === "number" ? item.value : 0),
                    0,
                  );
                  return `${label} · ${totalLabel}: ${formatINRCurrency(total)}`;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{
                  fontSize: "12px",
                  color: "var(--app-text-muted)",
                  paddingBottom: 4,
                }}
              />
              {series.map((s, index) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color}
                  stackId="stack"
                  maxBarSize={horizontal ? 22 : 44}
                  radius={
                    horizontal
                      ? index === series.length - 1
                        ? [0, 4, 4, 0]
                        : [0, 0, 0, 0]
                      : index === series.length - 1
                        ? [4, 4, 0, 0]
                        : [0, 0, 0, 0]
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
