"use client";

import { useState } from "react";
import { formatINRCurrency } from "@nivra/ui";
import {
  IconChart,
  IconDonut,
  IconSip,
  IconStepUp,
  IconTarget,
  IconTimeline,
  moneyCell,
  WealthAnalyticsChrome,
  WealthCompareBars,
  WealthDataTable,
  WealthGrowthLine,
  WealthIconMark,
  WealthLedgerShell,
  wealthLedgerTdClass,
  wealthLedgerThClass,
  wealthLedgerTheadClass,
  WealthMixDonut,
  WealthSegmented,
  WealthStatusNote,
  wealthChart,
  wealthMixColors,
  type WealthTableColumn,
} from "@/components/wealth";

export type CompoundingLeg = {
  monthlySip: number;
  invested: number;
  maturity: number;
  gain: number;
  tax: number;
  netAfterTax: number;
  lumpsum?: number;
};

export type CompoundingGrowthStep = {
  step: number;
  targetCorpus: number;
  corpus: number;
  months: number;
};

export type CompoundingResult = {
  targetGoal: number;
  extraYears?: number;
  investmentType?: "one-time" | "sip";
  stepSize?: number;
  standard: CompoundingLeg;
  lumpsum: CompoundingLeg;
  growthSteps?: CompoundingGrowthStep[];
  schedule: Array<Record<string, number>>;
};

const STEP_LABEL: Record<number, string> = {
  10_000: "₹10,000 steps",
  100_000: "₹1,00,000 steps",
  1_000_000: "₹10,00,000 steps",
  10_000_000: "₹1,00,00,000 steps",
};

export function formatDurationYm(months: number): string {
  const whole = Math.max(0, Math.trunc(months));
  return `${Math.floor(whole / 12)}y ${whole % 12}m`;
}

export function compoundingStepLabel(stepSize: number | undefined): string {
  return STEP_LABEL[stepSize ?? 0] ?? "Wealth steps";
}

function getCompoundingView(result: CompoundingResult, tenureYears: number) {
  const standard = result.standard;
  const lumpsum = result.lumpsum;
  const lumpsumToday = lumpsum.lumpsum ?? 0;
  const investmentType = result.investmentType ?? "one-time";
  const steps = result.growthSteps ?? [];
  const stepMeta = compoundingStepLabel(result.stepSize);
  const selectedLabel = investmentType === "sip" ? "SIP" : "One Time";

  const scheduleColumns: WealthTableColumn<Record<string, number>>[] = [
    {
      key: "year",
      header: "Year",
      sticky: true,
      searchValue: (row) => String(row.year ?? ""),
      render: (row) => String(row.year ?? ""),
    },
    {
      key: "sipMonthly",
      header: "Monthly SIP",
      align: "right",
      searchValue: (row) => String(row.sipMonthly ?? ""),
      render: (row) => moneyCell(row.sipMonthly ?? 0),
    },
    {
      key: "sipYearEnd",
      header: "SIP year-end",
      align: "right",
      tone: "emerald",
      searchValue: (row) => String(row.sipYearEnd ?? ""),
      render: (row) => moneyCell(row.sipYearEnd ?? 0),
    },
    {
      key: "lumpsumEnd",
      header: "Lumpsum year-end",
      align: "right",
      tone: "amber",
      searchValue: (row) => String(row.lumpsumEnd ?? ""),
      render: (row) => moneyCell(row.lumpsumEnd ?? 0),
    },
  ];

  return {
    standard,
    lumpsum,
    lumpsumToday,
    investmentType,
    steps,
    stepMeta,
    selectedLabel,
    scheduleColumns,
    tenureYears,
  };
}

/** Charts and path cards for Analytics section. */
export function CompoundingAnalytics({
  result,
  tenureYears,
}: {
  result: CompoundingResult;
  tenureYears: number;
}) {
  const [tab, setTab] = useState<"growth" | "compare" | "mix">("growth");
  const {
    standard,
    lumpsum,
    lumpsumToday,
    investmentType,
    steps,
    stepMeta,
    selectedLabel,
  } = getCompoundingView(result, tenureYears);

  const growthChart = (
    <WealthGrowthLine
      data={result.schedule.map((row) => ({
        year: row.year,
        sip: row.sipYearEnd ?? 0,
        lumpsum: row.lumpsumEnd ?? 0,
      }))}
      xTick={(v) => `Y${v}`}
      series={[
        { key: "sip", label: "SIP year-end", color: wealthChart.standard, kind: "area" },
        {
          key: "lumpsum",
          label: "Lumpsum year-end",
          color: wealthChart.stepUp,
          kind: "line",
        },
      ]}
    />
  );

  const compareChart = (
    <WealthCompareBars
      showBarLabels
      height="h-[300px] sm:h-[340px]"
      data={[
        {
          category: "Invested",
          sip: standard.invested,
          lumpsum: lumpsum.invested,
        },
        {
          category: "Gain",
          sip: standard.gain,
          lumpsum: lumpsum.gain,
        },
        {
          category: "Tax",
          sip: standard.tax,
          lumpsum: lumpsum.tax,
        },
        {
          category: "Net",
          sip: standard.netAfterTax,
          lumpsum: lumpsum.netAfterTax,
        },
      ]}
      series={[
        { key: "sip", label: "SIP", color: wealthChart.standard },
        { key: "lumpsum", label: "Lumpsum", color: wealthChart.stepUp },
      ]}
    />
  );

  const mixChart = (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <WealthMixDonut
        title="SIP at goal year"
        centerLabel="Pre-tax"
        centerValue={standard.maturity}
        tax={standard.tax}
        net={standard.netAfterTax}
        netLabel="Net"
        slices={[
          {
            name: "Invested",
            value: standard.invested,
            color: wealthMixColors.invested,
          },
          {
            name: "Gain",
            value: standard.gain,
            color: wealthMixColors.gain,
          },
        ]}
      />
      <WealthMixDonut
        title="Lumpsum at goal year"
        centerLabel="Pre-tax"
        centerValue={lumpsum.maturity}
        tax={lumpsum.tax}
        net={lumpsum.netAfterTax}
        netLabel="Net"
        slices={[
          {
            name: "Invested",
            value: lumpsum.invested,
            color: wealthMixColors.secondary,
          },
          {
            name: "Gain",
            value: lumpsum.gain,
            color: wealthMixColors.secondaryGain,
          },
        ]}
      />
    </div>
  );

  const activeChart =
    tab === "compare" ? compareChart : tab === "mix" ? mixChart : growthChart;

  return (
    <div className="space-y-5">
      <WealthAnalyticsChrome
        tabs={
          <WealthSegmented
            variant="underline"
            layoutId="compounding-analytics-tabs"
            value={tab}
            onChange={setTab}
            options={[
              {
                id: "growth",
                label: "Growth",
                icon: <IconChart className="h-3.5 w-3.5" />,
              },
              {
                id: "compare",
                label: "Comparison",
                icon: <IconTimeline className="h-3.5 w-3.5" />,
              },
              {
                id: "mix",
                label: "Corpus Mix",
                icon: <IconDonut className="h-3.5 w-3.5" />,
              },
            ]}
          />
        }
      >
        <div className="min-w-0 overflow-hidden">{activeChart}</div>
      </WealthAnalyticsChrome>

      <CompoundingPathsBoard
        standard={standard}
        lumpsumToday={lumpsumToday}
        lumpsum={lumpsum}
        investmentType={investmentType}
      />

      {steps.length === 0 ? (
        <WealthStatusNote tone="info">
          Insufficient value for growth steps on the {selectedLabel} path with {stepMeta}. Choose a
          smaller step size or a larger goal.
        </WealthStatusNote>
      ) : (
        <WealthStatusNote tone="info">
          Growth steps track the {selectedLabel} path in {stepMeta}. Open the ledger below for the
          year-by-year schedule and each crossing.
        </WealthStatusNote>
      )}
    </div>
  );
}

/** Yearly table and wealth steps for Schedule section. */
export function CompoundingSchedule({
  result,
  tenureYears,
}: {
  result: CompoundingResult;
  tenureYears: number;
}) {
  const { steps, stepMeta, selectedLabel, scheduleColumns } = getCompoundingView(
    result,
    tenureYears,
  );
  const last = result.schedule[result.schedule.length - 1];

  return (
    <div className="space-y-5">
      <WealthDataTable
        rows={result.schedule}
        columns={scheduleColumns}
        getRowKey={(row, i) => row.year ?? i}
        filterPlaceholder="Filter by year…"
        summary={[
          { label: "Years", value: String(result.schedule.length) },
          {
            label: "Goal year",
            value: String(tenureYears),
            tone: "std",
          },
          {
            label: "SIP year-end",
            value: formatINRCurrency(last?.sipYearEnd ?? 0),
            tone: "std",
          },
          {
            label: "Lumpsum year-end",
            value: formatINRCurrency(last?.lumpsumEnd ?? 0),
            tone: "step",
          },
        ]}
        note="Each row is one plan year. SIP year-end and lumpsum year-end are the projected corpus under each funding path."
      />

      <WealthStepsLedger
        steps={steps}
        selectedLabel={selectedLabel}
        stepMeta={stepMeta}
      />
    </div>
  );
}

/** @deprecated Prefer CompoundingAnalytics + CompoundingSchedule in separate WealthSections. */
export function CompoundingResults({
  result,
  tenureYears,
}: {
  result: CompoundingResult;
  tenureYears: number;
}) {
  return (
    <div className="space-y-5">
      <CompoundingAnalytics result={result} tenureYears={tenureYears} />
      <CompoundingSchedule result={result} tenureYears={tenureYears} />
    </div>
  );
}

function CompoundingPathsBoard({
  standard,
  lumpsumToday,
  lumpsum,
  investmentType,
}: {
  standard: CompoundingLeg;
  lumpsumToday: number;
  lumpsum: CompoundingLeg;
  investmentType: "one-time" | "sip";
}) {
  const paths = [
    {
      key: "sip",
      title: "Monthly SIP",
      heroLabel: "Every month",
      heroValue: standard.monthlySip,
      hint: "Flat for the full tenure",
      leg: standard,
      selected: investmentType === "sip",
      mark: (
        <WealthIconMark tone="emerald" className="h-7 w-7">
          <IconSip className="h-3.5 w-3.5" />
        </WealthIconMark>
      ),
    },
    {
      key: "lumpsum",
      title: "Lumpsum today",
      heroLabel: "Pay once",
      heroValue: lumpsumToday,
      hint: "One-time amount today",
      leg: lumpsum,
      selected: investmentType === "one-time",
      mark: (
        <WealthIconMark className="h-7 w-7">
          <IconStepUp className="h-3.5 w-3.5" />
        </WealthIconMark>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
          Funding paths
        </div>
        <h3 className="mt-1.5 text-[15px] font-medium tracking-tight text-slate-900">
          SIP vs lumpsum to the same goal
        </h3>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-500">
          Two ways to reach the same net after tax. Growth steps follow the path selected in
          Profile.
        </p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
        {paths.map((path) => {
          const rows = [
            { label: "Invested", value: path.leg.invested, tone: "neutral" as const },
            { label: "Gain", value: path.leg.gain, tone: "emerald" as const },
            { label: "Tax", value: path.leg.tax, tone: "rose" as const },
            { label: "Net after tax", value: path.leg.netAfterTax, tone: "net" as const },
          ];

          return (
            <div
              key={path.key}
              className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_8px_24px_rgba(15,23,42,0.04)] sm:px-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {path.mark}
                  <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                    {path.title}
                  </div>
                </div>
                {path.selected ? (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    Growth steps
                  </span>
                ) : (
                  <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    Compare
                  </span>
                )}
              </div>

              <div className="mt-3">
                <div className="text-[13px] text-slate-500">{path.heroLabel}</div>
                <div className="mt-0.5 text-[24px] font-medium tracking-tight tabular-nums text-slate-900">
                  {formatINRCurrency(path.heroValue)}
                </div>
                <p className="mt-1 text-[12px] text-slate-500">{path.hint}</p>
              </div>

              <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-3">
                {rows.map((row) => (
                  <div key={row.label} className="flex items-baseline justify-between gap-3">
                    <dt className="text-[13px] text-slate-500">{row.label}</dt>
                    <dd
                      className={
                        row.tone === "net"
                          ? "text-[14px] font-semibold tabular-nums tracking-tight text-emerald-800"
                          : row.tone === "emerald"
                            ? "text-[14px] font-medium tabular-nums tracking-tight text-emerald-700"
                            : row.tone === "rose"
                              ? "text-[14px] font-medium tabular-nums tracking-tight text-rose-600"
                              : "text-[14px] font-medium tabular-nums tracking-tight text-slate-900"
                      }
                    >
                      {formatINRCurrency(row.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WealthStepsLedger({
  steps,
  selectedLabel,
  stepMeta,
}: {
  steps: CompoundingGrowthStep[];
  selectedLabel: string;
  stepMeta: string;
}) {
  return (
    <div className="space-y-2.5">
      <div>
        <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">
          Wealth growth steps
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
          {selectedLabel} path · {stepMeta}. Each row is the first time corpus crosses that
          milestone.
        </p>
      </div>

      {steps.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-5">
          <div className="flex items-center gap-2.5">
            <WealthIconMark className="h-7 w-7">
              <IconTarget className="h-3.5 w-3.5" />
            </WealthIconMark>
            <p className="text-sm text-slate-500">
              No milestones to show for this path and step size.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <WealthLedgerShell className="min-w-[36rem]">
            <table className="w-full border-collapse text-left text-[13px] tabular-nums">
              <thead>
                <tr className={wealthLedgerTheadClass()}>
                  <th className={wealthLedgerThClass("left")}>Step</th>
                  <th className={wealthLedgerThClass("right", "emerald")}>Corpus</th>
                  <th className={wealthLedgerThClass("right")}>Time to reach</th>
                  <th className={wealthLedgerThClass("left")}>From previous</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {steps.map((step, index) => {
                  const prevMonths = index === 0 ? 0 : steps[index - 1]!.months;
                  const increment = step.months - prevMonths;
                  const isLast = index === steps.length - 1;
                  return (
                    <tr
                      key={step.step}
                      className={
                        isLast
                          ? "border-t border-emerald-200/80 bg-emerald-50/60"
                          : "transition-colors hover:bg-slate-50/80"
                      }
                    >
                      <td className={wealthLedgerTdClass("left")}>
                        {isLast ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-600 px-2 py-0.5 text-[12px] font-semibold text-white">
                            {step.step}
                          </span>
                        ) : (
                          <span className="tabular-nums text-slate-700">{step.step}</span>
                        )}
                      </td>
                      <td
                        className={
                          isLast
                            ? "px-4 py-3.5 text-right text-[14px] font-semibold tabular-nums text-emerald-900"
                            : wealthLedgerTdClass("right", "emerald")
                        }
                      >
                        {formatINRCurrency(step.targetCorpus)}
                      </td>
                      <td className={wealthLedgerTdClass("right")}>
                        {formatDurationYm(step.months)}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-500">
                        {index === 0
                          ? `Reached in ${formatDurationYm(step.months)}`
                          : `+${formatDurationYm(increment)} from previous`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </WealthLedgerShell>
        </div>
      )}
    </div>
  );
}
