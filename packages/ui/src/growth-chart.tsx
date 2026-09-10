import {
  CartesianGrid,
  LabelList,
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

function axisTick(value: number) {
  return `₹${formatCompactINR(value)}`;
}

/** Label only the last point of a series. */
function EndLabel(props: {
  x?: number;
  y?: number;
  index?: number;
  value?: number;
  dataLength: number;
  color: string;
  fullCurrency?: boolean;
  seriesIndex?: number;
}) {
  const {
    x = 0,
    y = 0,
    index = 0,
    value,
    dataLength,
    color,
    fullCurrency = false,
    seriesIndex = 0,
  } = props;
  if (index !== dataLength - 1 || value == null || !Number.isFinite(value)) return null;
  // Stagger stacked end labels so three series do not collide.
  const dy = 4 + seriesIndex * 12;
  return (
    <text
      x={x + 6}
      y={y}
      dy={dy}
      fill={color}
      fontSize={10}
      fontWeight={600}
      textAnchor="start"
    >
      {fullCurrency ? formatINRCurrency(value) : `₹${formatCompactINR(value)}`}
    </text>
  );
}

export function GrowthChart({
  data,
  series,
  title = "Corpus Growth",
  showEndLabels = false,
  endpointDots = false,
  markers = false,
  xTickFormatter,
  endLabelFull = false,
  className,
  strokeWidth = 4,
}: {
  data: GrowthPoint[];
  series: Array<{ key: string; label: string; color: string }>;
  title?: string;
  /** Compact labels at the right end of each line. */
  showEndLabels?: boolean;
  /** Draw a dot on the final year only. */
  endpointDots?: boolean;
  /** Draw markers on every data point. */
  markers?: boolean;
  /** Custom X-axis tick labels (e.g. Month 0). */
  xTickFormatter?: (value: number) => string;
  /** Use full INR on the end label instead of compact. */
  endLabelFull?: boolean;
  className?: string;
  /** Line stroke thickness (default 4). */
  strokeWidth?: number;
}) {
  const n = data.length;
  return (
    <div
      className={`flex min-h-[220px] flex-1 flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:min-h-[240px] sm:p-3.5 ${className ?? ""}`}
    >
      <div className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        {title}
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 8,
                right: showEndLabels ? (endLabelFull ? 88 : 64) : 12,
                left: 4,
                bottom: 8,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
                stroke="var(--app-border)"
                tickFormatter={xTickFormatter}
                interval={n <= 16 ? 0 : "preserveStartEnd"}
              />
              <YAxis
                tickFormatter={axisTick}
                tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
                width={58}
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
                    : String(label)
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
                  paddingTop: 12,
                }}
                iconSize={10}
                iconType="plainline"
              />
              {series.map((s, seriesIndex) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={strokeWidth}
                  dot={
                    markers
                      ? {
                          r: 4,
                          fill: s.color,
                          stroke: "var(--app-surface)",
                          strokeWidth: 2,
                        }
                      : endpointDots
                        ? (props: { index?: number; cx?: number; cy?: number }) => {
                            const { index = 0, cx = 0, cy = 0 } = props;
                            if (index !== n - 1) return <g key={`${s.key}-empty-${index}`} />;
                            return (
                              <circle
                                key={`${s.key}-end`}
                                cx={cx}
                                cy={cy}
                                r={4.5}
                                fill={s.color}
                                stroke="var(--app-surface)"
                                strokeWidth={2}
                              />
                            );
                          }
                        : false
                  }
                  activeDot={{ r: 6, fill: s.color, stroke: "var(--app-surface)", strokeWidth: 2 }}
                >
                  {showEndLabels ? (
                    <LabelList
                      dataKey={s.key}
                      content={(props) => {
                        const x = typeof props.x === "number" ? props.x : Number(props.x) || 0;
                        const y = typeof props.y === "number" ? props.y : Number(props.y) || 0;
                        const value =
                          typeof props.value === "number"
                            ? props.value
                            : Number(props.value);
                        return (
                          <EndLabel
                            x={x}
                            y={y}
                            index={props.index}
                            value={Number.isFinite(value) ? value : undefined}
                            dataLength={n}
                            color={s.color}
                            fullCurrency={endLabelFull}
                            seriesIndex={seriesIndex}
                          />
                        );
                      }}
                    />
                  ) : null}
                </Line>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
