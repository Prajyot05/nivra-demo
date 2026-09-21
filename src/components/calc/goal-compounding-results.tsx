"use client";

import { formatINRCurrency } from "@nivra/ui";
import {
  IconSip,
  IconStepUp,
  IconTarget,
  moneyCell,
  WealthDataTable,
  WealthGrowthLine,
  WealthIconMark,
  WealthMixDonut,
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
  const { standard, lumpsumToday, investmentType, steps, stepMeta, selectedLabel } =
    getCompoundingView(result, tenureYears);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PathCard
          kind="sip"
          selected={investmentType === "sip"}
          eyebrow="SIP"
          title="Monthly SIP required"
          primary={formatINRCurrency(standard.monthlySip)}
          primaryHint="Every month"
          rows={[
            { label: "Invested", value: formatINRCurrency(standard.invested) },
            { label: "Pre-tax corpus", value: formatINRCurrency(standard.maturity) },
            { label: "Tax", value: formatINRCurrency(standard.tax) },
            { label: "Net after tax", value: formatINRCurrency(standard.netAfterTax) },
          ]}
        />
        <PathCard
          kind="lumpsum"
          selected={investmentType === "one-time"}
          eyebrow="One Time"
          title="Lumpsum required"
          primary={formatINRCurrency(lumpsumToday)}
          primaryHint="Pay once"
          rows={[
            { label: "Invested", value: formatINRCurrency(result.lumpsum.invested) },
            { label: "Pre-tax corpus", value: formatINRCurrency(result.lumpsum.maturity) },
            { label: "Tax", value: formatINRCurrency(result.lumpsum.tax) },
            { label: "Net after tax", value: formatINRCurrency(result.lumpsum.netAfterTax) },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <WealthGrowthLine
            data={result.schedule.map((row) => ({
              year: row.year,
              sip: row.sipYearEnd ?? 0,
              lumpsum: row.lumpsumEnd ?? 0,
            }))}
            xTick={(v) => `Y${v}`}
            series={[
              { key: "sip", label: "SIP year-end", color: wealthChart.standard, kind: "area" },
              { key: "lumpsum", label: "Lumpsum year-end", color: wealthChart.stepUp, kind: "line" },
            ]}
          />
        </div>
        <div className="min-w-0 xl:col-span-5">
          <WealthMixDonut
            title="SIP at goal year"
            centerLabel="Pre-tax corpus"
            centerValue={standard.maturity}
            tax={standard.tax}
            net={standard.netAfterTax}
            netLabel="Net after tax"
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
        </div>
      </div>

      {steps.length === 0 ? (
        <WealthStatusNote tone="info">
          Insufficient value for growth steps on the {selectedLabel} path with {stepMeta}. Choose a
          smaller step size or a larger goal.
        </WealthStatusNote>
      ) : null}
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

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-7">
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
              value: formatINRCurrency(
                result.schedule[result.schedule.length - 1]?.sipYearEnd ?? 0,
              ),
              tone: "std",
            },
            {
              label: "Lumpsum year-end",
              value: formatINRCurrency(
                result.schedule[result.schedule.length - 1]?.lumpsumEnd ?? 0,
              ),
              tone: "step",
            },
          ]}
          note="Each row is one plan year. SIP year-end and lumpsum year-end are the projected corpus under each funding path."
        />
      </div>
      <div className="min-w-0 lg:col-span-5">
        <WealthStepsPanel steps={steps} selectedLabel={selectedLabel} stepMeta={stepMeta} />
      </div>
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

function PathCard({
  kind,
  selected,
  eyebrow,
  title,
  primary,
  primaryHint,
  rows,
}: {
  kind: "sip" | "lumpsum";
  selected: boolean;
  eyebrow: string;
  title: string;
  primary: string;
  primaryHint: string;
  rows: Array<{ label: string; value: string }>;
}) {
  const sip = kind === "sip";
  const shell = sip
    ? "border-slate-200/80 bg-slate-50/60"
    : "border-emerald-200/70 bg-emerald-50/40";
  const eyebrowClass = sip ? "text-slate-500" : "text-emerald-700";
  const badgeClass = sip ? "bg-slate-800 text-white" : "bg-emerald-700 text-white";

  return (
    <div className={`flex min-w-0 flex-col rounded-2xl border p-4 ${shell}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <WealthIconMark className="h-7 w-7" tone={sip ? "slate" : "emerald"}>
            {sip ? <IconSip className="h-3.5 w-3.5" /> : <IconStepUp className="h-3.5 w-3.5" />}
          </WealthIconMark>
          <div>
            <div className={`text-[10px] font-semibold uppercase tracking-wide ${eyebrowClass}`}>
              {eyebrow}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-slate-900">{title}</div>
          </div>
        </div>
        {selected ? (
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}
          >
            Growth steps
          </span>
        ) : null}
      </div>
      <div className="mt-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {primaryHint}
        </div>
        <div className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums text-slate-900 sm:text-2xl">
          {primary}
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-white/80 px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {row.label}
            </dt>
            <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-slate-900">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function WealthStepsPanel({
  steps,
  selectedLabel,
  stepMeta,
}: {
  steps: CompoundingGrowthStep[];
  selectedLabel: string;
  stepMeta: string;
}) {
  if (steps.length === 0) {
    return (
      <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-4">
        <div className="flex items-center gap-2">
          <WealthIconMark className="h-7 w-7">
            <IconTarget className="h-3.5 w-3.5" />
          </WealthIconMark>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
              Wealth growth steps
            </div>
            <div className="text-sm text-slate-500">{selectedLabel}</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">
          No milestones to show for this path and step size.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-4">
      <div className="flex items-center gap-2">
        <WealthIconMark tone="emerald" className="h-7 w-7">
          <IconTarget className="h-3.5 w-3.5" />
        </WealthIconMark>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            Wealth growth steps
          </div>
          <div className="text-sm text-slate-600">
            {selectedLabel} · {stepMeta}
          </div>
        </div>
      </div>
      <ol className="mt-3 flex flex-col">
        {steps.map((step, index) => {
          const prevMonths = index === 0 ? 0 : steps[index - 1]!.months;
          const increment = step.months - prevMonths;
          const isLast = index === steps.length - 1;
          return (
            <li key={step.step} className="flex gap-3">
              <div className="flex w-7 shrink-0 flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                    isLast ? "bg-emerald-700 text-white" : "bg-slate-800 text-white"
                  }`}
                >
                  {step.step}
                </div>
                {index < steps.length - 1 ? (
                  <div className="min-h-3 w-px flex-1 bg-slate-200" />
                ) : null}
              </div>
              <div
                className={`mb-2 min-w-0 flex-1 rounded-lg border px-3 py-2 last:mb-0 ${
                  isLast
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-slate-200 bg-slate-50/80"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-semibold tabular-nums text-slate-900">
                    {formatINRCurrency(step.targetCorpus)}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      isLast ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {formatDurationYm(step.months)}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {index === 0
                    ? `Reached in ${formatDurationYm(step.months)}`
                    : `+${formatDurationYm(increment)} from the previous step`}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
