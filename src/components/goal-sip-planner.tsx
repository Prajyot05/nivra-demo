"use client";

import { useState } from "react";
import { useGoalSip } from "@/hooks/use-goal-sip";
import {
  AgeInput,
  CompareChart,
  CompositionChart,
  Field,
  formatINRCurrency,
  META_TEXT,
  ModeTabs,
  MoneyInput,
  PercentInput,
  ScheduleTable,
  Stack,
  StatCard,
  StatGrid,
  StatusNote,
  TextInput,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import { GoalSipDossier, GOAL_SIP_REPORT_ID } from "@/components/reports/goal-sip-dossier";
import { generatePdfFromElement } from "@/lib/pdf-generator";

function CorpusMixFooter({
  taxAmt,
  netAfterTax,
}: {
  taxAmt: number;
  netAfterTax: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      <div className="flex items-baseline justify-between gap-2 rounded-md border border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] px-2.5 py-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-warn-text)]">
          Capital Gains Tax
        </div>
        <div className="text-xs font-semibold tabular-nums text-[var(--app-warn-text-strong)]">
          {formatINRCurrency(taxAmt)}
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2 rounded-md border border-[var(--app-step-text)]/25 bg-[var(--app-step-bg)] px-2.5 py-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
          Net Corpus
        </div>
        <div className="text-xs font-semibold tabular-nums text-[var(--app-text)]">
          {formatINRCurrency(netAfterTax)}
        </div>
      </div>
    </div>
  );
}

export function GoalSipPlanner() {
  const [clientName, setClientName] = useState("Mr. John Doe");
  const [age, setAge] = useState(30);
  const [goal, setGoal] = useState(10_000_000);
  const [tenure, setTenure] = useState(15);
  const [returnPct, setReturnPct] = useState(12);
  const [inflation, setInflation] = useState(5.25);
  const [tax, setTax] = useState(12.5);
  const [stepUp, setStepUp] = useState(10);
  const [useInflAdj, setUseInflAdj] = useState(true);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [isDownloading, setIsDownloading] = useState(false);

  const nameError = !clientName.trim() ? "Client Name required." : undefined;
  const ageError = age < 18 || age > 100 ? "Enter a valid age." : undefined;
  const goalError = goal <= 0 ? "Enter your goal amount." : undefined;
  const tenureError =
    tenure < 1 || tenure > 75 ? "Tenure should be between 1 and 75 years." : undefined;
  const returnError =
    returnPct <= 0 || returnPct > 100 ? "Enter a valid expected return." : undefined;
  const inflationError =
    inflation < 0 || inflation > 100 ? "Inflation cannot be negative." : undefined;
  const taxError = tax < 0 || tax > 100 ? "Tax should be between 0 and 100%." : undefined;
  const stepUpError =
    stepUp < 0 || stepUp > 100 ? "Step-up cannot be negative." : undefined;

  const canCalculate =
    !nameError &&
    !ageError &&
    !goalError &&
    !tenureError &&
    !returnError &&
    !inflationError &&
    !taxError &&
    !stepUpError;

  const { result, error, loading } = useGoalSip(
    {
      clientName,
      age,
      goalAmount: goal,
      tenureYears: tenure,
      returnPct,
      inflationPct: inflation,
      taxPct: tax,
      stepUpPct: stepUp,
      useInflationAdjustedGoal: useInflAdj,
    },
    canCalculate,
  );

  const inflAdjGoal = result?.inflAdjGoal ?? 0;
  const targetGoal = result?.targetGoal ?? goal;
  const standardSIP = result?.standard.monthlySip ?? 0;
  const stepUpSIP = result?.stepUp.monthlySip ?? 0;
  const stepUpEndSIP = result?.stepUp.endMonthlySip ?? 0;
  const stdInvested = result?.standard.invested ?? 0;
  const stepInvested = result?.stepUp.invested ?? 0;
  const stdCorpus = result?.standard.maturity ?? 0;
  const stepCorpus = result?.stepUp.maturity ?? 0;
  const stdGain = result?.standard.gain ?? 0;
  const stepGain = result?.stepUp.gain ?? 0;
  const stdTax = result?.standard.tax ?? 0;
  const stepTax = result?.stepUp.tax ?? 0;
  const stdNet = result?.standard.netAfterTax ?? 0;
  const stepNet = result?.stepUp.netAfterTax ?? 0;
  const combinedSchedule = result?.schedule ?? [];
  const delays = (result?.delays ?? []).map((d) => ({
    mo: d.months,
    sip: d.sipRequired,
    extra: d.extraInvested,
  }));
  const stdSchedule = combinedSchedule.map((row) => ({
    year: row.year,
    monthly: row.stdMonthly,
    yearEnd: row.stdYearEnd,
  }));
  const stepSchedule = combinedSchedule.map((row) => ({
    year: row.year,
    monthly: row.stepMonthly,
    yearEnd: row.stepYearEnd,
  }));

  const mixSlices = (invested: number, gain: number) => [
    { name: "Invested", value: invested, color: "var(--app-chart-invested)" },
    { name: "Gain", value: gain, color: "var(--app-chart-gain)" },
  ];

  const handleDownload = async () => {
    if (!result || isDownloading) return;
    setIsDownloading(true);
    try {
      const safe = (clientName || "client")
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      await generatePdfFromElement(GOAL_SIP_REPORT_ID, `goal-sip-planner-${safe || "report"}`);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <CalculatorPage
        title="Goal – SIP & Step-Up SIP"
        description="Required monthly SIP and step-up SIP so the net corpus after capital gains tax reaches the goal."
        actions={
          <ReportDownloadButton
            onClick={handleDownload}
            disabled={!result || !canCalculate}
            loading={isDownloading}
          />
        }
        form={
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)]">
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
              <div className="col-span-2 sm:col-span-1">
                <Field label="Client Name" error={nameError}>
                  <TextInput
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={
                      nameError
                        ? "border-[var(--app-danger)] focus-visible:ring-[var(--app-danger)]"
                        : undefined
                    }
                  />
                </Field>
              </div>
              <div>
                <AgeInput value={age} onChange={setAge} error={ageError} />
              </div>
              <div>
                <MoneyInput
                  label="Goal amount"
                  value={goal}
                  onChange={setGoal}
                  align="right"
                  error={goalError}
                />
              </div>
              <div>
                <YearInput
                  label="Tenure (yrs)"
                  value={tenure}
                  min={1}
                  max={75}
                  onChange={setTenure}
                  error={tenureError}
                />
              </div>
              <div>
                <PercentInput
                  label="Return (%)"
                  value={returnPct}
                  onChange={setReturnPct}
                  error={returnError}
                />
              </div>
              <div>
                <PercentInput
                  label="Inflation (%)"
                  value={inflation}
                  onChange={setInflation}
                  error={inflationError}
                />
              </div>
              <div>
                <PercentInput label="Tax (%)" value={tax} onChange={setTax} error={taxError} />
              </div>
              <div>
                <PercentInput
                  label="Step-Up (%)"
                  value={stepUp}
                  onChange={setStepUp}
                  hint="Annual SIP increase"
                  error={stepUpError}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-subtle)] sm:text-[11px]">
                  Goal basis
                </span>
                <ModeTabs
                  fullWidth
                  tabs={[
                    { id: "raw", label: "Stated goal" },
                    { id: "infl", label: "Inflation-adjusted" },
                  ]}
                  value={useInflAdj ? "infl" : "raw"}
                  onChange={(id) => setUseInflAdj(id === "infl")}
                />
                <span className={META_TEXT}>
                  {useInflAdj
                    ? "Target grows with inflation over tenure"
                    : "Uses the stated goal amount"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-2 text-xs sm:text-sm">
                  <span className="text-[var(--app-text-muted)]">Stated goal</span>
                  <span className="font-semibold tabular-nums text-[var(--app-text)]">
                    {formatINRCurrency(goal)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2 text-xs sm:text-sm">
                  <span className="text-[var(--app-text-muted)]">Inflation-adjusted</span>
                  <span className="font-semibold tabular-nums text-[var(--app-warn-text-strong)]">
                    {canCalculate && result ? formatINRCurrency(inflAdjGoal) : "-"}
                  </span>
                </div>
                <div className="mt-0.5 flex items-baseline justify-between gap-2 border-t border-[var(--app-border)] pt-2 text-xs sm:text-sm">
                  <span className="font-medium text-[var(--app-text)]">Active target</span>
                  <span className="font-semibold tabular-nums text-[var(--app-step-text)]">
                    {canCalculate && result ? formatINRCurrency(targetGoal) : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
        results={
          <>
            {!canCalculate ? (
              <StatusNote tone="error">Fix the highlighted inputs to calculate.</StatusNote>
            ) : null}
            {error ? (
              <StatusNote tone="error">
                {error}. Start the app with <code>npm run dev</code>.
              </StatusNote>
            ) : null}
            {loading && !result && canCalculate ? (
              <StatusNote tone="pending">Calculating…</StatusNote>
            ) : null}
            {result && canCalculate ? (
              <Stack>
                <StatGrid>
                  <StatCard
                    title="Standard SIP"
                    value={standardSIP}
                    hint="Required monthly SIP"
                  />
                  <StatCard
                    title="Step-Up SIP"
                    value={stepUpSIP}
                    hint="Starting monthly SIP"
                    variant="soft"
                    footer={
                      <>
                        Ending SIP after {tenure} years ·{" "}
                        <span className="font-semibold tabular-nums text-[var(--app-primary-fg)]">
                          {formatINRCurrency(stepUpEndSIP)}
                        </span>
                        /mo
                      </>
                    }
                  />
                  <StatCard
                    title="Target Corpus"
                    value={targetGoal}
                    hint="Net after capital gains tax"
                  />
                </StatGrid>

                <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
                  <div
                    className={`flex min-w-0 flex-col gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 sm:p-4 xl:col-span-2`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-text-muted)] sm:text-xs">
                        {chartType === "pie"
                          ? "Corpus Breakdown"
                          : "Standard vs Step-Up Comparison"}
                      </h3>
                      <ModeTabs
                        tabs={[
                          { id: "pie", label: "Pie chart" },
                          { id: "bar", label: "Bar chart" },
                        ]}
                        value={chartType}
                        onChange={(id) => setChartType(id as "pie" | "bar")}
                      />
                    </div>
                    {chartType === "pie" ? (
                      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
                        <CompositionChart
                          title="Standard SIP"
                          compact
                          showPercentages
                          centerLabel="Pre-Tax Corpus"
                          centerValue={stdCorpus}
                          slices={mixSlices(stdInvested, stdGain)}
                          footer={<CorpusMixFooter taxAmt={stdTax} netAfterTax={stdNet} />}
                        />
                        <CompositionChart
                          title="Step-Up SIP"
                          compact
                          showPercentages
                          centerLabel="Pre-Tax Corpus"
                          centerValue={stepCorpus}
                          slices={mixSlices(stepInvested, stepGain)}
                          footer={<CorpusMixFooter taxAmt={stepTax} netAfterTax={stepNet} />}
                        />
                      </div>
                    ) : (
                      <CompareChart
                        title="Standard vs Step-Up"
                        showBarLabels
                        className="min-h-[280px] flex-1 sm:min-h-[320px]"
                        data={[
                          { category: "Invested", sip: stdInvested, step: stepInvested },
                          { category: "Gain", sip: stdGain, step: stepGain },
                          { category: "Pre-Tax Corpus", sip: stdCorpus, step: stepCorpus },
                          { category: "Net Corpus", sip: stdNet, step: stepNet },
                        ]}
                        series={[
                          { key: "sip", label: "SIP", color: "var(--app-chart-a)" },
                          { key: "step", label: "Step-Up", color: "var(--app-chart-b)" },
                        ]}
                      />
                    )}
                  </div>

                  <ScheduleTable
                    caption="Cost of Delay"
                    meta="Later start, higher SIP"
                    fillHeight
                    emphasizeRow={(_, index) => index === delays.length - 1}
                    columns={[
                      {
                        key: "mo",
                        header: "Delay",
                        sticky: true,
                        render: (value) => `${Number(value)} Mo`,
                      },
                      {
                        key: "sip",
                        header: "Required SIP",
                        format: "inr",
                        align: "right",
                        tone: "std",
                      },
                      {
                        key: "extra",
                        header: "Additional Cost",
                        format: "inr",
                        align: "right",
                        tone: "warn",
                      },
                    ]}
                    rows={delays}
                  />
                </div>

                <ScheduleTable
                  caption="Yearly Schedule"
                  meta={`${combinedSchedule.length} years`}
                  zebra
                  highlightLastRow
                  columns={[
                    { key: "year", header: "Yr", sticky: true },
                    {
                      key: "stdMonthly",
                      header: "Std SIP",
                      format: "inr",
                      align: "right",
                      tone: "std",
                    },
                    {
                      key: "stdYearEnd",
                      header: "Std. End Corpus",
                      format: "inr",
                      align: "right",
                      tone: "std",
                    },
                    {
                      key: "stepMonthly",
                      header: "Step-Up SIP",
                      format: "inr",
                      align: "right",
                      tone: "step",
                    },
                    {
                      key: "stepYearEnd",
                      header: "Step-Up End Corpus",
                      format: "inr",
                      align: "right",
                      tone: "step",
                    },
                  ]}
                  rows={combinedSchedule}
                />
              </Stack>
            ) : null}
          </>
        }
      />
      {result && canCalculate ? (
        <GoalSipDossier
          data={{
            clientName,
            age,
            goal,
            inflAdjGoal,
            useInflAdj,
            targetGoal,
            tenure,
            returnPct,
            inflation,
            tax,
            stepUp,
            standardSIP,
            stepUpSIP,
            stepUpEndSIP,
            stdInvested,
            stepInvested,
            stdGain,
            stepGain,
            stdTax,
            stepTax,
            stdCorpus,
            stepCorpus,
            stdNet,
            stepNet,
            stdSchedule,
            stepSchedule,
            delays,
          }}
        />
      ) : null}
    </>
  );
}
