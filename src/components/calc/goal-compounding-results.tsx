"use client";

import {
  Card,
  CompositionChart,
  formatCompactINR,
  formatINRCurrency,
  GrowthChart,
  META_TEXT,
  MICRO_LABEL,
  PILL,
  ResultsSplit,
  ScheduleTable,
  SectionHeader,
  Stack,
  StatCard,
  StatGrid,
  StatusNote,
} from "@nivra/ui";

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

export function CompoundingResults({
  result,
  tenureYears,
}: {
  result: CompoundingResult;
  tenureYears: number;
}) {
  const standard = result.standard;
  const lumpsum = result.lumpsum;
  const lumpsumToday = lumpsum.lumpsum ?? 0;
  const investmentType = result.investmentType ?? "one-time";
  const steps = result.growthSteps ?? [];
  const stepMeta = compoundingStepLabel(result.stepSize);
  const selectedLabel = investmentType === "sip" ? "SIP" : "One Time";

  return (
    <Stack>
      <StatGrid>
        <StatCard title="Target goal" value={result.targetGoal} tone="neutral" />
        <StatCard
          title="Monthly SIP required"
          value={standard.monthlySip}
          hint="Every month for the full tenure"
          tone="positive"
        />
        <StatCard
          title="Lumpsum required"
          value={lumpsumToday}
          hint="One-time amount today"
          tone="neutral"
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
            { label: "Invested", value: formatINRCurrency(lumpsum.invested) },
            { label: "Pre-tax corpus", value: formatINRCurrency(lumpsum.maturity) },
            { label: "Tax", value: formatINRCurrency(lumpsum.tax) },
            { label: "Net after tax", value: formatINRCurrency(lumpsum.netAfterTax) },
          ]}
        />
      </div>

      <ResultsSplit
        left={
          <GrowthChart
            title="SIP vs lumpsum growth"
            className="min-h-[280px] w-full flex-1 sm:min-h-[320px]"
            data={result.schedule.map((row) => ({
              year: row.year,
              sip: row.sipYearEnd ?? 0,
              lumpsum: row.lumpsumEnd ?? 0,
            }))}
            series={[
              { key: "sip", label: "SIP year-end", color: "var(--app-chart-a)" },
              { key: "lumpsum", label: "Lumpsum year-end", color: "var(--app-chart-gain)" },
            ]}
            referenceLines={
              steps.length > 0 && steps.length <= 8
                ? steps.map((step) => ({
                    y: step.targetCorpus,
                    label: `₹${formatCompactINR(step.targetCorpus)}`,
                    color: "var(--app-text-subtle)",
                  }))
                : undefined
            }
          />
        }
        right={
          <CompositionChart
            title="SIP at goal year"
            centerLabel="Pre-tax corpus"
            centerValue={standard.maturity}
            showPercentages
            size="lg"
            slices={[
              {
                name: "Invested",
                value: standard.invested,
                color: "var(--app-chart-invested)",
              },
              {
                name: "Gain",
                value: standard.gain,
                color: "var(--app-chart-gain)",
              },
            ]}
            footer={
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <div className="flex items-baseline justify-between gap-2 rounded-md border border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] px-2.5 py-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-warn-text)]">
                    Tax
                  </div>
                  <div className="text-xs font-semibold tabular-nums text-[var(--app-warn-text-strong)]">
                    {formatINRCurrency(standard.tax)}
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-2 rounded-md border border-[var(--app-step-text)]/25 bg-[var(--app-step-bg)] px-2.5 py-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
                    Net after tax
                  </div>
                  <div className="text-xs font-semibold tabular-nums text-[var(--app-text)]">
                    {formatINRCurrency(standard.netAfterTax)}
                  </div>
                </div>
              </div>
            }
          />
        }
      />

      {steps.length === 0 ? (
        <StatusNote tone="warn">
          Insufficient value for growth steps on the {selectedLabel} path with {stepMeta}. Choose a
          smaller step size or a larger goal.
        </StatusNote>
      ) : null}

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
        <div className="relative order-2 min-h-0 min-w-0 lg:order-1 lg:col-span-7">
          <ScheduleTable
            caption="Yearly schedule"
            meta={`${result.schedule.length} years · goal in year ${tenureYears}`}
            zebra
            fillHeight
            stretchRows={false}
            highlightLastRow={result.extraYears == null || result.extraYears === 0}
            emphasizeRow={(row) => Number(row.year) === tenureYears}
            className="lg:absolute lg:inset-0"
            columns={[
              { key: "year", header: "Year", sticky: true },
              {
                key: "sipMonthly",
                header: "Monthly SIP",
                format: "inr",
                align: "right",
                tone: "std",
              },
              {
                key: "sipYearEnd",
                header: "SIP year-end",
                format: "inr",
                align: "right",
                tone: "std",
              },
              {
                key: "lumpsumEnd",
                header: "Lumpsum year-end",
                format: "inr",
                align: "right",
                tone: "step",
              },
            ]}
            rows={result.schedule}
          />
        </div>
        <div className="order-1 min-w-0 lg:order-2 lg:col-span-5 lg:h-full">
          <WealthStepsPanel
            steps={steps}
            selectedLabel={selectedLabel}
            stepMeta={stepMeta}
          />
        </div>
      </div>
    </Stack>
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
    ? "bg-[var(--app-std-bg)] border-[var(--app-std-text)]/25"
    : "bg-[var(--app-step-bg)] border-[var(--app-step-text)]/25";
  const eyebrowClass = sip ? "text-[var(--app-std-text)]" : "text-[var(--app-step-text)]";
  const badgeClass = sip
    ? "bg-[var(--app-std-text)] text-white"
    : "bg-[var(--app-step-text)] text-white";

  return (
    <div className={`flex min-w-0 flex-col rounded-xl border p-3.5 sm:p-4 ${shell}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className={`${MICRO_LABEL} ${eyebrowClass}`}>{eyebrow}</div>
          <div className="mt-0.5 text-sm font-semibold text-[var(--app-text)]">{title}</div>
        </div>
        {selected ? (
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}
          >
            Growth steps
          </span>
        ) : null}
      </div>
      <div className="mt-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-subtle)]">
          {primaryHint}
        </div>
        <div className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums text-[var(--app-text)] sm:text-2xl">
          {primary}
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-white/70 px-3 py-2">
            <dt className={MICRO_LABEL}>{row.label}</dt>
            <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-[var(--app-text)]">
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
      <Card className="h-full">
        <SectionHeader title="Wealth growth steps" meta={selectedLabel} />
        <p className={`mt-3 ${META_TEXT}`}>No milestones to show for this path and step size.</p>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <SectionHeader
        title="Wealth growth steps"
        meta={`${selectedLabel} · ${stepMeta}`}
      />
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
                    isLast
                      ? "bg-[var(--app-step-text)] text-white"
                      : "bg-[var(--app-primary)] text-[var(--app-primary-fg)]"
                  }`}
                >
                  {step.step}
                </div>
                {index < steps.length - 1 ? (
                  <div className="min-h-3 w-px flex-1 bg-[var(--app-border)]" />
                ) : null}
              </div>
              <div
                className={`mb-2 min-w-0 flex-1 rounded-lg border px-3 py-2 last:mb-0 ${
                  isLast
                    ? "border-[var(--app-step-text)]/25 bg-[var(--app-step-bg)]"
                    : "border-[var(--app-border)] bg-[var(--app-surface-muted)]"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-semibold tabular-nums text-[var(--app-text)]">
                    {formatINRCurrency(step.targetCorpus)}
                  </span>
                  <span
                    className={`${PILL} ${
                      isLast
                        ? "bg-[var(--app-step-text)] text-white"
                        : "bg-[var(--app-std-bg)] text-[var(--app-std-text)]"
                    }`}
                  >
                    {formatDurationYm(step.months)}
                  </span>
                </div>
                <div className={`mt-0.5 ${META_TEXT}`}>
                  {index === 0
                    ? `Reached in ${formatDurationYm(step.months)}`
                    : `+${formatDurationYm(increment)} from the previous step`}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
