"use client";

import { useId, useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisINR, formatINRCurrency } from "./format";
import { CARD, CARD_PAD, SECTION_TITLE } from "./tokens";

export type WithdrawalMilestone = {
  age: number;
  label: string;
  amount: number;
};

export type WithdrawalPathPoint = {
  year: number;
  corpus: number;
  /** Corpus after withdrawals at this age (when a payout occurs). */
  after?: number | null;
  /** Total withdrawal amount at this age. */
  withdrawal?: number;
  /** Corpus value at withdrawal ages for red markers. */
  marker?: number | null;
};

/**
 * Wealth journey: yearly corpus growth with red milestones at each withdrawal age.
 */
export function WithdrawalPathChart({
  data,
  milestones,
  title = "Corpus over age",
  className,
  /** Hide title + caption (for PDF dossiers that supply their own heading). */
  compact = false,
}: {
  data: WithdrawalPathPoint[];
  milestones: WithdrawalMilestone[];
  title?: string;
  className?: string;
  compact?: boolean;
}) {
  const gradId = `wealth-corpus-${useId().replace(/:/g, "")}`;

  const byAge = useMemo(() => {
    const map = new Map<number, WithdrawalMilestone[]>();
    for (const m of milestones) {
      const list = map.get(m.age) ?? [];
      list.push(m);
      map.set(m.age, list);
    }
    return map;
  }, [milestones]);

  const uniqueAges = useMemo(
    () => [...byAge.keys()].sort((a, b) => a - b),
    [byAge],
  );

  const chartData = useMemo(
    () =>
      data.map((d) => {
        const withdrawal = d.withdrawal ?? 0;
        const after =
          d.after != null
            ? d.after
            : withdrawal > 0
              ? Math.max(0, d.corpus - withdrawal)
              : null;
        return {
          ...d,
          withdrawal,
          after,
          marker: withdrawal > 0 ? d.corpus : null,
        };
      }),
    [data],
  );

  const markerData = useMemo(
    () =>
      chartData
        .filter((d) => d.marker != null && Number(d.marker) > 0)
        .map((d) => ({
          year: d.year,
          marker: d.marker as number,
        })),
    [chartData],
  );

  const startAge = chartData[0]?.year;
  const endAge = chartData[chartData.length - 1]?.year;

  return (
    <div
      className={`flex min-h-[300px] flex-1 flex-col ${CARD} ${CARD_PAD} sm:min-h-[340px] ${className ?? ""}`}
    >
      {!compact ? (
        <>
          <div className={`mb-1 shrink-0 ${SECTION_TITLE}`}>
            {title}
          </div>
          <p className="mb-3 shrink-0 text-[11px] text-[var(--app-text-subtle)]">
            Corpus grows with SIP each year. Red markers show where wealth is withdrawn for a goal.
          </p>
        </>
      ) : null}
      <div className="relative flex-1">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--app-chart-gain)" stopOpacity={0.28} />
                  <stop offset="55%" stopColor="var(--app-chart-gain)" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="var(--app-chart-gain)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border)" vertical={false} />
              <XAxis
                dataKey="year"
                type="number"
                domain={
                  startAge != null && endAge != null ? [startAge, endAge] : ["dataMin", "dataMax"]
                }
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
                stroke="var(--app-border)"
                label={{
                  value: "Age",
                  position: "insideBottomRight",
                  offset: -2,
                  style: { fontSize: 10, fill: "var(--app-text-subtle)" },
                }}
              />
              <YAxis
                tickFormatter={formatAxisINR}
                tick={{ fontSize: 11, fill: "var(--app-text-muted)" }}
                width={56}
                stroke="transparent"
              />
              <Tooltip
                cursor={{ stroke: "var(--app-primary-soft)", strokeWidth: 1, strokeDasharray: "4 4" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const age = Number(label);
                  const point = chartData.find((d) => d.year === age);
                  if (!point) return null;

                  const goals = byAge.get(age) ?? [];
                  const withdrawal = point.withdrawal ?? 0;
                  const isEvent = withdrawal > 0;
                  const corpusBefore = point.corpus;
                  const corpusAfter =
                    point.after != null ? point.after : Math.max(0, corpusBefore - withdrawal);
                  const goalTitle =
                    goals.length > 0
                      ? goals.map((g) => g.label).join(" · ")
                      : "Withdrawal";

                  return (
                    <div className="min-w-[13rem] max-w-[18rem] rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 py-3 text-xs shadow-lg shadow-[color-mix(in_srgb,var(--app-text)_12%,transparent)]">
                      {isEvent ? (
                        <>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-danger)]">
                            Withdrawal event
                          </div>
                          <div className="mt-1 text-sm font-semibold leading-snug text-[var(--app-text)]">
                            {goalTitle}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[var(--app-text-muted)]">
                            Withdrawal age {age}
                          </div>
                          <div className="mt-2.5 space-y-1.5 border-t border-[var(--app-border)] pt-2.5">
                            <TooltipRow
                              label="Corpus before"
                              value={formatINRCurrency(corpusBefore)}
                              tone="gain"
                            />
                            <TooltipRow
                              label="Withdrawal"
                              value={formatINRCurrency(withdrawal)}
                              tone="danger"
                            />
                            <TooltipRow
                              label="Corpus after"
                              value={formatINRCurrency(corpusAfter)}
                              tone="muted"
                            />
                          </div>
                          {goals.length > 1 ? (
                            <div className="mt-2.5 space-y-1 border-t border-dashed border-[var(--app-border)] pt-2">
                              {goals.map((g) => (
                                <div
                                  key={`${g.age}-${g.label}-${g.amount}`}
                                  className="flex items-start justify-between gap-3"
                                >
                                  <span className="min-w-0 truncate text-[var(--app-text)]">
                                    {g.label}
                                  </span>
                                  <span className="shrink-0 tabular-nums text-[var(--app-danger)]">
                                    {formatINRCurrency(g.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
                            Corpus value
                          </div>
                          <div className="mt-1 text-sm font-semibold text-[var(--app-text)]">
                            Age {age}
                          </div>
                          <div className="mt-2 tabular-nums text-sm font-semibold text-[var(--app-step-text)]">
                            {formatINRCurrency(corpusBefore)}
                          </div>
                        </>
                      )}
                    </div>
                  );
                }}
              />
              <Legend
                content={() => (
                  <div className="flex flex-wrap items-center justify-center gap-5 pt-2 text-[11px] text-[var(--app-text-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-0.5 w-5 rounded-full"
                        style={{ background: "var(--app-chart-gain)" }}
                      />
                      Corpus Value
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full ring-2 ring-[var(--app-surface)]"
                        style={{ background: "var(--app-danger)" }}
                      />
                      Withdrawal Event
                    </span>
                  </div>
                )}
              />
              {uniqueAges.map((age) => (
                <ReferenceLine
                  key={`ref-${age}`}
                  x={age}
                  stroke="var(--app-danger)"
                  strokeOpacity={0.35}
                  strokeDasharray="3 4"
                  strokeWidth={1.25}
                />
              ))}
              <Area
                type="monotone"
                dataKey="corpus"
                name="Corpus Value"
                stroke="var(--app-chart-gain)"
                strokeWidth={2.75}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "var(--app-chart-gain)",
                  stroke: "var(--app-surface)",
                  strokeWidth: 2,
                }}
                legendType="none"
                isAnimationActive={false}
              />
              <Scatter
                data={markerData}
                dataKey="marker"
                name="Withdrawal Event"
                fill="var(--app-danger)"
                legendType="none"
                isAnimationActive={false}
                shape={(props: { cx?: number; cy?: number }) => {
                  const { cx = 0, cy = 0 } = props;
                  return (
                    <g>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={8}
                        fill="var(--app-danger)"
                        fillOpacity={0.16}
                        stroke="none"
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4.5}
                        fill="var(--app-danger)"
                        stroke="var(--app-surface)"
                        strokeWidth={2}
                      />
                    </g>
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function TooltipRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "gain" | "danger" | "muted";
}) {
  const valueClass =
    tone === "gain"
      ? "text-[var(--app-step-text)]"
      : tone === "danger"
        ? "text-[var(--app-danger)]"
        : "text-[var(--app-text-muted)]";
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--app-text-muted)]">{label}</span>
      <span className={`tabular-nums font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}
