"use client";

import { useState } from "react";
import { useGoalSip } from "@/hooks/use-goal-sip";
import { Switch } from "@/components/ui/switch";
import {
  CHIP,
  CHIP_OFF,
  CHIP_ON,
  ClientHeader,
  CompareChart,
  CompositionChart,
  formatINR,
  formatINRCurrency,
  FormGrid,
  MICRO_LABEL,
  MoneyInput,
  PercentInput,
  ResultsSplit,
  ScheduleTable,
  SectionHeader,
  Stack,
  StatCard,
  StatGrid,
  StatusNote,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import { GoalSipDossier, GOAL_SIP_REPORT_ID } from "@/components/reports/goal-sip-dossier";
import { generatePdfFromElement } from "@/lib/pdf-generator";

/** Human-readable Rs in Cr / Lakh / Thousand for the goal-basis callout. */
const fmtRsUnit = (n: number) => {
  if (!Number.isFinite(n)) return "Rs. —";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 10000000) {
    return `${sign}Rs. ${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}Rs. ${(abs / 100000).toFixed(2)} Lakh`;
  }
  if (abs >= 1000) {
    return `${sign}Rs. ${(abs / 1000).toFixed(2)} Thousand`;
  }
  return `${sign}Rs. ${Math.round(abs)}`;
};

export function GoalSipPlanner() {
  const [clientName, setClientName] = useState("Mr. John Doe");
  const [age, setAge] = useState(30);
  const [goal, setGoal] = useState(1000000);
  const [tenure, setTenure] = useState(15);
  const [returnPct, setReturnPct] = useState(12);
  const [inflation, setInflation] = useState(5.75);
  const [tax, setTax] = useState(12.5);
  const [stepUp, setStepUp] = useState(10);
  const [useInflAdj, setUseInflAdj] = useState(false);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [isDownloading, setIsDownloading] = useState(false);

  const { result, error, loading } = useGoalSip({
    clientName,
    age,
    goalAmount: goal,
    tenureYears: tenure,
    returnPct,
    inflationPct: inflation,
    taxPct: tax,
    stepUpPct: stepUp,
    useInflationAdjustedGoal: useInflAdj,
  });

  const inflAdjGoal = result?.inflAdjGoal ?? 0;
  const targetGoal = result?.targetGoal ?? goal;
  const standardSIP = result?.standard.monthlySip ?? 0;
  const stepUpSIP = result?.stepUp.monthlySip ?? 0;
  const stdInvested = result?.standard.invested ?? 0;
  const stepInvested = result?.stepUp.invested ?? 0;
  const stdCorpus = result?.standard.maturity ?? 0;
  const stepCorpus = result?.stepUp.maturity ?? 0;
  const stdGain = result?.standard.gain ?? 0;
  const stepGain = result?.stepUp.gain ?? 0;
  const stdTax = result?.standard.tax ?? 0;
  const stepTax = result?.stepUp.tax ?? 0;
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

  const mixSlices = (invested: number, gain: number, taxAmt: number) => [
    { name: "Invested", value: invested, color: "var(--app-chart-invested)" },
    { name: "Gain (Pre-Tax)", value: gain, color: "var(--app-chart-gain)" },
    { name: "Capital Gain Tax", value: taxAmt, color: "var(--app-chart-tax)" },
  ];

  return (
    <>
      <CalculatorPage
        title="Goal – SIP & Step-Up SIP"
        description="Required monthly SIP and step-up SIP so the net corpus after capital gains tax reaches the goal."
        actions={
          <ReportDownloadButton
            onClick={handleDownload}
            disabled={!result}
            loading={isDownloading}
          />
        }
        form={
          <>
            <FormGrid>
              <ClientHeader
                name={clientName}
                age={age}
                onNameChange={setClientName}
                onAgeChange={setAge}
              />
              <MoneyInput label="Goal amount" value={goal} onChange={setGoal} align="right" />
              <YearInput label="Tenure (yrs)" value={tenure} min={1} max={50} onChange={setTenure} />
              <PercentInput label="Return (%)" value={returnPct} onChange={setReturnPct} />
              <PercentInput label="Inflation (%)" value={inflation} onChange={setInflation} />
              <PercentInput label="Tax (%)" value={tax} onChange={setTax} />
              <PercentInput
                label="Step-Up (%)"
                value={stepUp}
                onChange={setStepUp}
                hint="Annual SIP Increase"
              />
            </FormGrid>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[var(--app-border)] pt-3">
              <span className={MICRO_LABEL}>Use Infl. Adj. Goal</span>
              <Switch checked={useInflAdj} onCheckedChange={setUseInflAdj} />
              {useInflAdj ? (
                <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-1 text-xs text-[var(--app-text-muted)] sm:flex-row sm:flex-wrap sm:items-center">
                  <span className="rounded-md border border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] px-2.5 py-1 text-xs font-medium text-[var(--app-warn-text)]">
                    Inflation Adjusted Goal:{" "}
                    <span className="font-semibold tabular-nums text-[var(--app-warn-text-strong)]">
                      {formatINRCurrency(inflAdjGoal)}
                    </span>
                  </span>
                  <span className="min-w-0">
                    Target Goal Amount:{" "}
                    <span className="font-semibold text-[var(--app-text)]">{fmtRsUnit(goal)}</span>
                  </span>
                  <span className="min-w-0 text-[var(--app-warn-muted)]">
                    Inflation Adjusted Goal:{" "}
                    <span className="font-semibold text-[var(--app-warn-text-strong)]">
                      {fmtRsUnit(inflAdjGoal)}
                    </span>
                  </span>
                </div>
              ) : null}
            </div>
          </>
        }
        results={
          <>
            {error ? (
              <StatusNote tone="error">
                {error}. Start the app with <code>npm run dev</code>.
              </StatusNote>
            ) : null}
            {loading && !result ? <StatusNote tone="pending">Calculating…</StatusNote> : null}
            {result ? (
              <Stack>
                <StatGrid>
                  <StatCard title="Standard SIP · monthly" value={standardSIP} />
                  <StatCard title="Step-Up SIP · monthly" value={stepUpSIP} variant="soft" />
                </StatGrid>

                <div className="flex flex-col gap-2.5">
                  <SectionHeader
                    title={
                      chartType === "pie" ? "Corpus Breakdown" : "Standard vs Step-Up Comparison"
                    }
                    actions={
                      <div className="flex gap-1.5" role="group" aria-label="Chart type">
                        {(
                          [
                            { id: "pie", label: "Pie Chart" },
                            { id: "bar", label: "Bar Chart" },
                          ] as const
                        ).map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            aria-pressed={chartType === option.id}
                            onClick={() => setChartType(option.id)}
                            className={`${CHIP} ${chartType === option.id ? CHIP_ON : CHIP_OFF}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    }
                  />
                  {chartType === "pie" ? (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <CompositionChart
                        title="Standard SIP"
                        size="lg"
                        showPercentages
                        centerLabel="Corpus"
                        centerValue={stdCorpus}
                        slices={mixSlices(stdInvested, stdGain, stdTax)}
                      />
                      <CompositionChart
                        title="Step-Up SIP"
                        size="lg"
                        showPercentages
                        centerLabel="Corpus"
                        centerValue={stepCorpus}
                        slices={mixSlices(stepInvested, stepGain, stepTax)}
                      />
                    </div>
                  ) : (
                    <CompareChart
                      title="Standard vs Step-Up"
                      showBarLabels
                      className="min-h-[320px] sm:min-h-[360px]"
                      data={[
                        { category: "Invested", sip: stdInvested, step: stepInvested },
                        { category: "Tax Liability", sip: stdTax, step: stepTax },
                        { category: "Final Corpus", sip: stdCorpus, step: stepCorpus },
                      ]}
                      series={[
                        { key: "sip", label: "SIP", color: "var(--app-chart-a)" },
                        { key: "step", label: "Step-Up", color: "var(--app-chart-b)" },
                      ]}
                    />
                  )}
                </div>

                <ResultsSplit
                  mobileFirst="left"
                  stretch={false}
                  left={
                    <ScheduleTable
                      caption="Yearly Schedule"
                      meta={`${combinedSchedule.length} years`}
                      zebra
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
                          header: "Std End",
                          format: "inr",
                          align: "right",
                          tone: "std",
                        },
                        {
                          key: "stepMonthly",
                          header: "Step SIP",
                          format: "inr",
                          align: "right",
                          tone: "step",
                        },
                        {
                          key: "stepYearEnd",
                          header: "Step End",
                          format: "inr",
                          align: "right",
                          tone: "step",
                        },
                      ]}
                      rows={combinedSchedule}
                    />
                  }
                  right={
                    <ScheduleTable
                      caption="Cost of Delay"
                      meta="Later start, higher SIP"
                      columns={[
                        {
                          key: "mo",
                          header: "Delay",
                          sticky: true,
                          render: (value) => `${formatINR(Number(value))} Mo`,
                        },
                        {
                          key: "sip",
                          header: "SIP Req.",
                          format: "inr",
                          align: "right",
                          tone: "std",
                        },
                        {
                          key: "extra",
                          header: "Extra",
                          format: "inr",
                          align: "right",
                          tone: "warn",
                        },
                      ]}
                      rows={delays}
                    />
                  }
                />
              </Stack>
            ) : null}
          </>
        }
      />
      {result ? (
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
            stdInvested,
            stepInvested,
            stdGain,
            stepGain,
            stdTax,
            stepTax,
            stdCorpus,
            stepCorpus,
            stdSchedule,
            stepSchedule,
            delays,
          }}
        />
      ) : null}
    </>
  );
}
