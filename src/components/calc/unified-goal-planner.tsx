"use client";

import { useMemo, useState, type ReactNode } from "react";
import { generateCalculatorReport, generatePdfFromElement } from "@/lib/pdf-generator";
import { playbookForPdf } from "@/lib/report-playbooks";
import {
  Card,
  ClientHeader,
  CompareChart,
  CompositionChart,
  formatINRCurrency,
  FormGrid,
  GrowthChart,
  META_TEXT,
  MICRO_LABEL,
  MoneyInput,
  ModeTabs,
  PercentInput,
  ResultCard,
  type ResultItem,
  ResultsSplit,
  ScheduleTable,
  SectionHeader,
  SectionTitle,
  SelectInput,
  Stack,
  StatCard,
  StatGrid,
  StatusNote,
  WaterfallChart,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import { CompoundingResults } from "@/components/calc/goal-compounding-results";
import { useCalculate } from "@/hooks/use-calculate";
import { useCalculatorMode } from "@/hooks/use-calculator-mode";
import { getCalculatorPageTitle } from "@/lib/calculator-nav";
import {
  GOAL_LS_SIP_REPORT_ID,
  GoalLsSipDossier,
} from "@/components/reports/goal-ls-sip-dossier";
import {
  GOAL_CURRENT_REPORT_ID,
  GoalCurrentDossier,
} from "@/components/reports/goal-current-dossier";
import {
  GOAL_EXISTING_REPORT_ID,
  GoalExistingDossier,
} from "@/components/reports/goal-existing-dossier";
import {
  GOAL_PERIODIC_REPORT_ID,
  GoalPeriodicDossier,
} from "@/components/reports/goal-periodic-dossier";
import {
  GOAL_COMPOUNDING_REPORT_ID,
  GoalCompoundingDossier,
} from "@/components/reports/goal-compounding-dossier";

const MODES = [
  { id: "sip", label: "SIP vs Step-up" },
  { id: "current", label: "Current investment" },
  { id: "ls-sip", label: "LS + SIP options" },
  { id: "existing", label: "Existing SIP" },
  { id: "periodic", label: "Periodic lumpsum" },
  { id: "compounding", label: "Growth steps" },
] as const;

type Mode = (typeof MODES)[number]["id"];
const MODE_IDS = MODES.map((m) => m.id);
const FREQUENCY_OPTIONS = [
  { value: "1", label: "1 · Yearly" },
  { value: "2", label: "2 · Half-yearly" },
  { value: "3", label: "3 · Every 4 months" },
  { value: "4", label: "4 · Quarterly" },
  { value: "6", label: "6 · Every 2 months" },
  { value: "12", label: "12 · Monthly" },
];

const COMPOUNDING_STEP_OPTIONS = [
  { value: "10000", label: "₹10,000 · 10K steps" },
  { value: "100000", label: "₹1,00,000 · 1L steps" },
  { value: "1000000", label: "₹10,00,000 · 10L steps" },
  { value: "10000000", label: "₹1,00,00,000 · 1Cr steps" },
];

const CALCULATOR_ID: Record<Mode, string> = {
  sip: "goal-sip",
  current: "goal-current",
  "ls-sip": "goal-ls-sip",
  existing: "goal-existing-sip",
  periodic: "goal-periodic",
  compounding: "goal-compounding",
};

type GoalLeg = {
  monthlySip: number;
  endMonthlySip?: number;
  invested: number;
  maturity: number;
  gain: number;
  tax: number;
  netAfterTax: number;
  lumpsum?: number;
};

type GoalPlannerResult = {
  inflAdjGoal: number;
  targetGoal: number;
  shortfall?: number;
  overfunded?: boolean;
  extraYears?: number;
  investmentType?: "one-time" | "sip";
  stepSize?: number;
  sipAfterExtra?: number;
  lumpsumAfterExtra?: number;
  growthSteps?: Array<{
    step: number;
    targetCorpus: number;
    corpus: number;
    months: number;
  }>;
  existing?: {
    corpusFv: number;
    sipFv: number;
    sipInvested?: number;
    totalFv: number;
    totalInvested: number;
    netCredit: number;
  };
  periodic?: {
    maturity: number;
    totalInvested: number;
    payments: number;
    gain?: number;
    tax?: number;
    netCredit: number;
  };
  extraLumpsum?: number;
  extraLumpsumFv?: number;
  existingCredit?: number;
  allLumpsum?: number;
  allSip?: number;
  mixSip?: number;
  mixStepUp?: number;
  mixStepUpEnd?: number;
  mixShortfall?: number;
  standard?: GoalLeg;
  stepUp?: GoalLeg;
  lumpsum?: GoalLeg;
  schedule: Array<Record<string, number>>;
  delays?: Array<{ months: number; sipRequired: number; extraInvested: number }>;
};

export function UnifiedGoalPlanner() {
  const [mode] = useCalculatorMode(MODE_IDS, "current");
  const compoundingLanding = mode === "compounding";
  const [name, setName] = useState("Mr. John Doe");
  const [age, setAge] = useState(30);
  const [goalAmount, setGoalAmount] = useState(compoundingLanding ? 5_000_000 : 10_000_000);
  const [tenureYears, setTenureYears] = useState(15);
  const [returnPct, setReturnPct] = useState(compoundingLanding ? 14 : 12);
  const [inflationPct, setInflationPct] = useState(5.25);
  const [taxPct, setTaxPct] = useState(12.5);
  const [stepUpPct, setStepUpPct] = useState(10);
  const [useInflAdj, setUseInflAdj] = useState(!compoundingLanding);
  const [currentCorpus, setCurrentCorpus] = useState(500_000);
  const [currentMonthlySip, setCurrentMonthlySip] = useState(5_000);
  const [extraLumpsum, setExtraLumpsum] = useState(200_000);
  const [periodicAmount, setPeriodicAmount] = useState(100_000);
  const [timesPerYear, setTimesPerYear] = useState(2);
  const [investmentType, setInvestmentType] = useState<"one-time" | "sip">("one-time");
  const [stepSize, setStepSize] = useState(1_000_000);

  const nameError = !name.trim() ? "Client Name required." : undefined;
  const ageError =
    age < 18 || age > 100 ? "Enter a valid age." : undefined;
  const goalError = goalAmount <= 0 ? "Enter your goal amount." : undefined;
  const tenureError =
    tenureYears < 1 || tenureYears > 50 ? "Tenure should be between 1 and 50 years." : undefined;
  const returnError =
    mode === "compounding"
      ? returnPct <= 0 || returnPct > 30
        ? "Enter a valid expected return percentage."
        : undefined
      : returnPct < 0 || returnPct > 30
        ? "Enter a valid expected return percentage."
        : undefined;
  const inflationError =
    inflationPct < 0 || inflationPct > 20 ? "Inflation should be between 0 and 20%." : undefined;
  const taxError = taxPct < 0 || taxPct > 100 ? "Tax should be between 0 and 100%." : undefined;
  const stepUpError =
    stepUpPct < 0 || stepUpPct > 100 ? "Step-up should be between 0 and 100%." : undefined;
  const corpusError = currentCorpus < 0 ? "Corpus cannot be negative." : undefined;
  const currentSipError = currentMonthlySip < 0 ? "Current SIP cannot be negative." : undefined;
  const extraLsError = extraLumpsum < 0 ? "Extra lumpsum cannot be negative." : undefined;
  const periodicAmountError =
    mode === "periodic" && periodicAmount <= 0
      ? "Periodic investment amount is required."
      : undefined;

  const canCalculate =
    !nameError &&
    !ageError &&
    !goalError &&
    !tenureError &&
    !returnError &&
    (mode === "compounding" || !inflationError) &&
    !taxError &&
    (mode === "compounding" ? true : !stepUpError) &&
    (mode !== "current" && mode !== "ls-sip" ? true : !corpusError) &&
    (mode !== "current" && mode !== "existing" ? true : !currentSipError) &&
    (mode !== "ls-sip" ? true : !extraLsError) &&
    (mode !== "periodic" ? true : !periodicAmountError);

  const input = useMemo(() => {
    const base = {
      clientName: name,
      age,
      goalAmount,
      tenureYears,
      returnPct,
      inflationPct,
      taxPct,
      useInflationAdjustedGoal: useInflAdj,
    };
    switch (mode) {
      case "sip":
        return { ...base, stepUpPct };
      case "current":
        return { ...base, stepUpPct, currentCorpus, currentMonthlySip };
      case "ls-sip":
        return { ...base, stepUpPct, currentCorpus, extraLumpsum };
      case "existing":
        return { ...base, stepUpPct, currentMonthlySip };
      case "periodic":
        return { ...base, stepUpPct, amount: periodicAmount, timesPerYear };
      case "compounding":
        return {
          clientName: name,
          age,
          goalAmount,
          tenureYears,
          returnPct,
          taxPct,
          extraYears: 0,
          investmentType,
          stepSize,
        };
    }
  }, [
    mode,
    name,
    age,
    goalAmount,
    tenureYears,
    returnPct,
    inflationPct,
    taxPct,
    stepUpPct,
    useInflAdj,
    currentCorpus,
    currentMonthlySip,
    extraLumpsum,
    periodicAmount,
    timesPerYear,
    investmentType,
    stepSize,
  ]);

  const { result, error, loading } = useCalculate<GoalPlannerResult>(
    CALCULATOR_ID[mode],
    input,
    canCalculate,
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!result || isDownloading) return;

    if (mode === "ls-sip") {
      setIsDownloading(true);
      try {
        const safe = (name || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          GOAL_LS_SIP_REPORT_ID,
          `goal-ls-sip-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    if (mode === "current") {
      setIsDownloading(true);
      try {
        const safe = (name || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          GOAL_CURRENT_REPORT_ID,
          `goal-current-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    if (mode === "existing") {
      setIsDownloading(true);
      try {
        const safe = (name || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          GOAL_EXISTING_REPORT_ID,
          `goal-existing-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    if (mode === "periodic") {
      setIsDownloading(true);
      try {
        const safe = (name || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          GOAL_PERIODIC_REPORT_ID,
          `goal-periodic-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    if (mode === "compounding") {
      setIsDownloading(true);
      try {
        const safe = (name || "client")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();
        await generatePdfFromElement(
          GOAL_COMPOUNDING_REPORT_ID,
          `goal-compounding-${safe || "report"}`,
        );
      } catch (err) {
        console.error("PDF download failed:", err);
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    const modeLabel =
      MODES.find((m) => m.id === mode)?.label ??
      String(mode);

    const headlines = [
      { label: "Target Goal", value: result.targetGoal, highlight: true as const, hint: useInflAdj ? "Inflation-adjusted goal used" : "Nominal goal used" },
      {
        label: result.standard
          ? "Standard SIP / Month"
          : result.shortfall != null
            ? "Shortfall"
            : "Inflation-Adj Goal",
        value: result.standard?.monthlySip ?? result.shortfall ?? result.inflAdjGoal,
        hint: result.stepUp ? `Step-up SIP ${Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(result.stepUp.monthlySip))} /mo` : undefined,
      },
    ];

    generateCalculatorReport({
      title: "Unified Goal Planner Dossier",
      subtitle: `${modeLabel} · analysis for ${name}`,
      clientName: name,
      age,
      status: result.overfunded ? "Overfunded" : "Validated Model",
      filename: `unified-goal-${name}`,
      headlines,
      metrics: [
        { label: "Inflation-Adj Goal", value: result.inflAdjGoal },
        { label: "Tenure", value: `${tenureYears} yrs`, currency: false },
        { label: "Expected Return", value: `${returnPct}%`, currency: false },
        {
          label: result.shortfall != null && result.shortfall > 0 ? "Shortfall" : "Tax Drag",
          value: result.shortfall != null && result.shortfall > 0 ? result.shortfall : (result.standard?.tax ?? result.lumpsum?.tax ?? 0),
          danger: (result.shortfall ?? 0) > 0,
        },
      ],
      assumptions: [
        ["Mode", modeLabel],
        ["Goal Amount", goalAmount, true],
        ["Tenure", `${tenureYears} Years`],
        ["Expected Return", `${returnPct}%`],
        ["Inflation", `${inflationPct}%`],
        ["Tax", `${taxPct}%`],
      ],
      tables: result.schedule
        ? [
            {
              title: "Yearly Schedule",
              head: scheduleColumns(mode).map((c) => c.header),
              body: result.schedule.map((row) =>
                scheduleColumns(mode).map((c) => (row as Record<string, number>)[c.key] ?? 0),
              ),
              columnAlignments: scheduleColumns(mode).map((c) =>
                c.align === "right" ? "right" : "left",
              ),
              currencyColumns: scheduleColumns(mode)
                .map((c, idx) => (c.format === "inr" ? idx : -1))
                .filter((x) => x !== -1),
            },
          ]
        : [],
      playbook: playbookForPdf("unified-goal"),
    });
  };

  return (
    <>
    <CalculatorPage
      title={getCalculatorPageTitle("/goals", mode)}
      description={
        mode === "compounding"
          ? "Required SIP or lumpsum so net after tax hits the goal, plus the time to each wealth step."
          : "Six goal modes. Additional SIP / lumpsum / step-up are solved so net after tax hits the goal."
      }
      actions={
        <ReportDownloadButton
          onClick={handleDownload}
          disabled={!result}
          loading={isDownloading}
        />
      }
      form={
        mode === "compounding" ? (
          <div className="grid w-fit max-w-full grid-cols-2 items-start gap-x-3 gap-y-3 sm:grid-cols-3 lg:grid-cols-[repeat(5,minmax(8.5rem,11rem))_16.5rem] lg:gap-x-4">
            <ClientHeader
              name={name}
              age={age}
              onNameChange={setName}
              onAgeChange={setAge}
              nameError={nameError}
              ageError={ageError}
            />
            <MoneyInput
              label="Goal amount"
              value={goalAmount}
              onChange={setGoalAmount}
              error={goalError}
              align="right"
            />
            <YearInput
              label="Tenure (yrs)"
              value={tenureYears}
              min={1}
              max={50}
              onChange={setTenureYears}
              error={tenureError}
              hint="Max. 50 years"
            />
            <PercentInput
              label="Return (%)"
              value={returnPct}
              onChange={setReturnPct}
              error={returnError}
            />
            <div className="lg:col-start-1 lg:row-start-2">
              <PercentInput label="Tax (%)" value={taxPct} onChange={setTaxPct} error={taxError} />
            </div>
            <div className="col-span-2 sm:col-span-3 lg:col-start-6 lg:row-span-2 lg:row-start-1">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-subtle)] sm:text-[11px]">
                    Investment for growth steps
                  </span>
                  <ModeTabs
                    fullWidth
                    tabs={[
                      { id: "one-time", label: "One Time" },
                      { id: "sip", label: "SIP" },
                    ]}
                    value={investmentType}
                    onChange={(id) => setInvestmentType(id === "sip" ? "sip" : "one-time")}
                  />
                  <span className={META_TEXT}>
                    {investmentType === "sip"
                      ? "Milestones use the required monthly SIP path"
                      : "Milestones use the required lumpsum path"}
                  </span>
                </div>
                <SelectInput
                  label="Growth step size"
                  value={String(stepSize)}
                  onChange={(value) => setStepSize(Number(value))}
                  options={COMPOUNDING_STEP_OPTIONS}
                  hint="10K, 1L, 10L, or 1Cr milestones"
                />
              </div>
            </div>
          </div>
        ) : mode === "existing" ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
                <ClientHeader
                  name={name}
                  age={age}
                  onNameChange={setName}
                  onAgeChange={setAge}
                  nameError={nameError}
                  ageError={ageError}
                />
                <MoneyInput
                  label="Goal amount"
                  value={goalAmount}
                  onChange={setGoalAmount}
                  error={goalError}
                  align="right"
                />
                <YearInput
                  label="Tenure (yrs)"
                  value={tenureYears}
                  min={1}
                  max={50}
                  onChange={setTenureYears}
                  error={tenureError}
                  hint="Max. 50 years"
                />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-5">
                <PercentInput
                  label="Return (%)"
                  value={returnPct}
                  onChange={setReturnPct}
                  error={returnError}
                />
                <PercentInput
                  label="Inflation (%)"
                  value={inflationPct}
                  onChange={setInflationPct}
                  error={inflationError}
                />
                <PercentInput
                  label="Tax (%)"
                  value={taxPct}
                  onChange={setTaxPct}
                  error={taxError}
                />
                <PercentInput
                  label="Step-up (%)"
                  value={stepUpPct}
                  onChange={setStepUpPct}
                  error={stepUpError}
                  hint="Annual SIP Increase"
                />
                <MoneyInput
                  label="Current SIP"
                  value={currentMonthlySip}
                  onChange={setCurrentMonthlySip}
                  error={currentSipError}
                  align="right"
                  hint="Existing monthly SIP"
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
                    {formatINRCurrency(goalAmount)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2 text-xs sm:text-sm">
                  <span className="text-[var(--app-text-muted)]">Inflation-adjusted</span>
                  <span className="font-semibold tabular-nums text-[var(--app-warn-text-strong)]">
                    {canCalculate && result ? formatINRCurrency(result.inflAdjGoal) : "-"}
                  </span>
                </div>
                <div className="mt-0.5 flex items-baseline justify-between gap-2 border-t border-[var(--app-border)] pt-2 text-xs sm:text-sm">
                  <span className="font-medium text-[var(--app-text)]">Active target</span>
                  <span className="font-semibold tabular-nums text-[var(--app-step-text)]">
                    {canCalculate && result ? formatINRCurrency(result.targetGoal) : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
        <div className="flex flex-col gap-3">
          <FormGrid>
            <ClientHeader
              name={name}
              age={age}
              onNameChange={setName}
              onAgeChange={setAge}
              nameError={nameError}
              ageError={ageError}
            />
            <MoneyInput
              label="Goal amount"
              value={goalAmount}
              onChange={setGoalAmount}
              error={goalError}
              align="right"
            />
            <YearInput
              label="Tenure (yrs)"
              value={tenureYears}
              min={1}
              max={50}
              onChange={setTenureYears}
              error={tenureError}
              hint="Max. 50 years"
            />
            <PercentInput
              label="Return (%)"
              value={returnPct}
              onChange={setReturnPct}
              error={returnError}
            />
            <PercentInput
              label="Inflation (%)"
              value={inflationPct}
              onChange={setInflationPct}
              error={inflationError}
            />
            <PercentInput label="Tax (%)" value={taxPct} onChange={setTaxPct} error={taxError} />
            <PercentInput
              label="Step-up (%)"
              value={stepUpPct}
              onChange={setStepUpPct}
              error={stepUpError}
              hint="Annual SIP Increase"
            />
          </FormGrid>

          <FormGrid>
            <div className="col-span-2 flex min-w-0 flex-col gap-1.5">
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
                {useInflAdj ? "Target grows with inflation over tenure" : "Uses the stated goal amount"}
              </span>
            </div>
            {mode === "periodic" ? (
              <>
                <MoneyInput
                  label="Periodic amt"
                  value={periodicAmount}
                  onChange={setPeriodicAmount}
                  error={periodicAmountError}
                  align="right"
                />
                <SelectInput
                  label="How often"
                  value={String(timesPerYear)}
                  onChange={(value) => setTimesPerYear(Number(value))}
                  options={FREQUENCY_OPTIONS}
                  hint={`${formatINRCurrency(periodicAmount * timesPerYear)} / year`}
                />
              </>
            ) : null}
            {mode === "current" || mode === "ls-sip" ? (
              <MoneyInput
                label="Current corpus"
                value={currentCorpus}
                onChange={setCurrentCorpus}
                error={corpusError}
                align="right"
              />
            ) : null}
            {mode === "current" ? (
              <MoneyInput
                label="Current SIP"
                value={currentMonthlySip}
                onChange={setCurrentMonthlySip}
                error={currentSipError}
                align="right"
              />
            ) : null}
            {mode === "ls-sip" ? (
              <MoneyInput
                label="Extra lumpsum"
                value={extraLumpsum}
                onChange={setExtraLumpsum}
                error={extraLsError}
                align="right"
              />
            ) : null}
          </FormGrid>
        </div>
        )
      }
      results={
        <>
          {error ? <StatusNote tone="error">{error}</StatusNote> : null}
          {!canCalculate ? (
            <StatusNote tone="warn">Fix the highlighted inputs to calculate.</StatusNote>
          ) : null}
          {loading && !result ? <StatusNote tone="pending">Calculating…</StatusNote> : null}
          {result ? (
            <GoalResults
              mode={mode}
              result={result}
              tenureYears={tenureYears}
              currentMonthlySip={currentMonthlySip}
            />
          ) : null}
        </>
      }
    />
    {mode === "ls-sip" &&
    result &&
    result.standard &&
    result.stepUp &&
    result.allLumpsum != null &&
    result.allSip != null &&
    result.mixSip != null ? (
      <GoalLsSipDossier
        data={{
          clientName: name,
          age,
          goalAmount,
          tenureYears,
          returnPct,
          inflationPct,
          taxPct,
          stepUpPct,
          useInflAdj,
          currentCorpus,
          extraLumpsum,
          inflAdjGoal: result.inflAdjGoal,
          targetGoal: result.targetGoal,
          existingCredit: result.existingCredit ?? 0,
          shortfall: result.shortfall ?? 0,
          extraLumpsumFv: result.extraLumpsumFv ?? 0,
          allLumpsum: result.allLumpsum,
          allSip: result.allSip,
          mixSip: result.mixSip,
          mixStepUp: result.mixStepUp ?? result.stepUp.monthlySip,
          overfunded: result.overfunded,
          standard: {
            monthlySip: result.standard.monthlySip,
            invested: result.standard.invested,
            maturity: result.standard.maturity,
            gain: result.standard.gain,
            tax: result.standard.tax,
            netAfterTax: result.standard.netAfterTax,
          },
          stepUp: {
            monthlySip: result.stepUp.monthlySip,
            endMonthlySip: result.stepUp.endMonthlySip,
            invested: result.stepUp.invested,
            maturity: result.stepUp.maturity,
            gain: result.stepUp.gain,
            tax: result.stepUp.tax,
            netAfterTax: result.stepUp.netAfterTax,
          },
          schedule: result.schedule.map((row) => ({
            year: row.year,
            extraLumpEnd: row.extraLumpEnd ?? 0,
            sipMonthly: row.sipMonthly ?? 0,
            sipYearEnd: row.sipYearEnd ?? 0,
            combinedEnd: row.combinedEnd ?? 0,
          })),
        }}
      />
    ) : null}
    {mode === "current" &&
    result &&
    result.existing &&
    result.standard &&
    result.stepUp &&
    result.lumpsum?.lumpsum != null ? (
      <GoalCurrentDossier
        data={{
          clientName: name,
          age,
          goalAmount,
          tenureYears,
          returnPct,
          inflationPct,
          taxPct,
          stepUpPct,
          useInflAdj,
          currentCorpus,
          currentMonthlySip,
          inflAdjGoal: result.inflAdjGoal,
          targetGoal: result.targetGoal,
          shortfall: result.shortfall ?? 0,
          overfunded: result.overfunded,
          existing: {
            corpusFv: result.existing.corpusFv,
            sipFv: result.existing.sipFv,
            totalFv: result.existing.totalFv,
            totalInvested: result.existing.totalInvested,
            netCredit: result.existing.netCredit,
          },
          lumpsum: {
            lumpsum: result.lumpsum.lumpsum ?? 0,
            invested: result.lumpsum.invested,
            maturity: result.lumpsum.maturity,
            gain: result.lumpsum.gain,
            tax: result.lumpsum.tax,
            netAfterTax: result.lumpsum.netAfterTax,
          },
          standard: {
            monthlySip: result.standard.monthlySip,
            invested: result.standard.invested,
            maturity: result.standard.maturity,
            gain: result.standard.gain,
            tax: result.standard.tax,
            netAfterTax: result.standard.netAfterTax,
          },
          stepUp: {
            monthlySip: result.stepUp.monthlySip,
            endMonthlySip: result.stepUp.endMonthlySip,
            invested: result.stepUp.invested,
            maturity: result.stepUp.maturity,
            gain: result.stepUp.gain,
            tax: result.stepUp.tax,
            netAfterTax: result.stepUp.netAfterTax,
          },
          schedule: result.schedule.map((row) => ({
            year: row.year,
            existingEnd: row.existingEnd ?? 0,
            sipMonthly: row.sipMonthly ?? 0,
            sipYearEnd: row.sipYearEnd ?? 0,
            stepMonthly: row.stepMonthly ?? 0,
            stepYearEnd: row.stepYearEnd ?? 0,
            combinedSipEnd: row.combinedSipEnd ?? 0,
          })),
        }}
      />
    ) : null}
    {mode === "existing" &&
    result &&
    result.existing &&
    result.standard &&
    result.stepUp &&
    result.lumpsum?.lumpsum != null ? (
      <GoalExistingDossier
        data={{
          clientName: name,
          age,
          goalAmount,
          tenureYears,
          returnPct,
          inflationPct,
          taxPct,
          stepUpPct,
          useInflAdj,
          currentMonthlySip,
          inflAdjGoal: result.inflAdjGoal,
          targetGoal: result.targetGoal,
          shortfall: result.shortfall ?? 0,
          overfunded: result.overfunded,
          existing: {
            sipFv: result.existing.sipFv,
            sipInvested: result.existing.sipInvested ?? result.existing.totalInvested,
            totalInvested: result.existing.totalInvested,
            netCredit: result.existing.netCredit,
          },
          lumpsum: {
            lumpsum: result.lumpsum.lumpsum ?? 0,
            invested: result.lumpsum.invested,
            maturity: result.lumpsum.maturity,
            gain: result.lumpsum.gain,
            tax: result.lumpsum.tax,
            netAfterTax: result.lumpsum.netAfterTax,
          },
          standard: {
            monthlySip: result.standard.monthlySip,
            invested: result.standard.invested,
            maturity: result.standard.maturity,
            gain: result.standard.gain,
            tax: result.standard.tax,
            netAfterTax: result.standard.netAfterTax,
          },
          stepUp: {
            monthlySip: result.stepUp.monthlySip,
            endMonthlySip: result.stepUp.endMonthlySip,
            invested: result.stepUp.invested,
            maturity: result.stepUp.maturity,
            gain: result.stepUp.gain,
            tax: result.stepUp.tax,
            netAfterTax: result.stepUp.netAfterTax,
          },
          schedule: result.schedule.map((row) => ({
            year: row.year,
            existingEnd: row.existingEnd ?? 0,
            sipMonthly: row.sipMonthly ?? 0,
            sipYearEnd: row.sipYearEnd ?? 0,
            stepMonthly: row.stepMonthly ?? 0,
            stepYearEnd: row.stepYearEnd ?? 0,
            combinedSipEnd: row.combinedSipEnd ?? 0,
          })),
        }}
      />
    ) : null}
    {mode === "periodic" &&
    result &&
    result.periodic &&
    result.standard &&
    result.stepUp &&
    result.lumpsum?.lumpsum != null ? (
      <GoalPeriodicDossier
        data={{
          clientName: name,
          age,
          goalAmount,
          tenureYears,
          returnPct,
          inflationPct,
          taxPct,
          stepUpPct,
          useInflAdj,
          periodicAmount,
          timesPerYear,
          inflAdjGoal: result.inflAdjGoal,
          targetGoal: result.targetGoal,
          shortfall: result.shortfall ?? 0,
          overfunded: result.overfunded,
          periodic: {
            maturity: result.periodic.maturity,
            totalInvested: result.periodic.totalInvested,
            payments: result.periodic.payments,
            gain:
              result.periodic.gain ??
              Math.max(0, result.periodic.maturity - result.periodic.totalInvested),
            tax:
              result.periodic.tax ??
              Math.max(0, result.periodic.maturity - result.periodic.netCredit),
            netCredit: result.periodic.netCredit,
          },
          lumpsum: {
            lumpsum: result.lumpsum.lumpsum ?? 0,
            invested: result.lumpsum.invested,
            maturity: result.lumpsum.maturity,
            gain: result.lumpsum.gain,
            tax: result.lumpsum.tax,
            netAfterTax: result.lumpsum.netAfterTax,
          },
          standard: {
            monthlySip: result.standard.monthlySip,
            invested: result.standard.invested,
            maturity: result.standard.maturity,
            gain: result.standard.gain,
            tax: result.standard.tax,
            netAfterTax: result.standard.netAfterTax,
          },
          stepUp: {
            monthlySip: result.stepUp.monthlySip,
            endMonthlySip: result.stepUp.endMonthlySip,
            invested: result.stepUp.invested,
            maturity: result.stepUp.maturity,
            gain: result.stepUp.gain,
            tax: result.stepUp.tax,
            netAfterTax: result.stepUp.netAfterTax,
          },
          schedule: result.schedule.map((row) => ({
            year: row.year,
            periodicPaid: row.periodicPaid ?? 0,
            periodicInvestedYtd: row.periodicInvestedYtd ?? 0,
            periodicCorpusEnd: row.periodicCorpusEnd,
            sipMonthly: row.sipMonthly ?? 0,
            sipYearEnd: row.sipYearEnd ?? 0,
            stepMonthly: row.stepMonthly ?? 0,
            stepYearEnd: row.stepYearEnd ?? 0,
          })),
        }}
      />
    ) : null}
    {mode === "compounding" &&
    result &&
    result.standard &&
    result.lumpsum?.lumpsum != null ? (
      <GoalCompoundingDossier
        data={{
          clientName: name,
          age,
          goalAmount,
          tenureYears,
          returnPct,
          taxPct,
          investmentType,
          stepSize,
          targetGoal: result.targetGoal,
          standard: {
            monthlySip: result.standard.monthlySip,
            invested: result.standard.invested,
            maturity: result.standard.maturity,
            gain: result.standard.gain,
            tax: result.standard.tax,
            netAfterTax: result.standard.netAfterTax,
          },
          lumpsum: {
            lumpsum: result.lumpsum.lumpsum ?? 0,
            invested: result.lumpsum.invested,
            maturity: result.lumpsum.maturity,
            gain: result.lumpsum.gain,
            tax: result.lumpsum.tax,
            netAfterTax: result.lumpsum.netAfterTax,
          },
          growthSteps: result.growthSteps ?? [],
          schedule: result.schedule.map((row) => ({
            year: row.year,
            sipMonthly: row.sipMonthly ?? 0,
            sipYearEnd: row.sipYearEnd ?? 0,
            lumpsumEnd: row.lumpsumEnd ?? 0,
          })),
        }}
      />
    ) : null}
    </>
  );
}

function GoalResults({
  mode,
  result,
  tenureYears,
  currentMonthlySip,
}: {
  mode: Mode;
  result: GoalPlannerResult;
  tenureYears: number;
  currentMonthlySip: number;
}) {
  if (mode === "ls-sip") {
    return <LsSipResults result={result} tenureYears={tenureYears} />;
  }
  if (mode === "current") {
    return <CurrentInvestmentResults result={result} tenureYears={tenureYears} />;
  }
  if (mode === "existing") {
    return (
      <ExistingSipResults
        result={result}
        tenureYears={tenureYears}
        currentMonthlySip={currentMonthlySip}
      />
    );
  }
  if (mode === "periodic") {
    return <PeriodicResults result={result} tenureYears={tenureYears} />;
  }
  if (mode === "compounding" && result.standard && result.lumpsum?.lumpsum != null) {
    return (
      <CompoundingResults
        tenureYears={tenureYears}
        result={{
          targetGoal: result.targetGoal,
          extraYears: result.extraYears,
          investmentType: result.investmentType,
          stepSize: result.stepSize,
          standard: result.standard,
          lumpsum: result.lumpsum,
          growthSteps: result.growthSteps,
          schedule: result.schedule,
        }}
      />
    );
  }

  const summaryItems: ResultItem[] = [
    { label: "Target goal", value: result.targetGoal, highlight: true, tone: "maturity" },
    { label: "Inflation-adjusted goal", value: result.inflAdjGoal },
  ];
  if (result.shortfall != null) {
    summaryItems.push({
      label: "Shortfall to fund",
      value: result.shortfall,
      highlight: true,
      tone: "delay",
    });
  }
  if (result.existingCredit != null) {
    summaryItems.push({ label: "Credit from current corpus", value: result.existingCredit });
  }
  if (result.existing) {
    summaryItems.push(
      { label: "Existing corpus FV", value: result.existing.corpusFv },
      { label: "Existing SIP FV", value: result.existing.sipFv },
      { label: "Existing net credit", value: result.existing.netCredit },
    );
  }
  if (result.periodic) {
    summaryItems.push(
      { label: "Periodic maturity", value: result.periodic.maturity },
      { label: "Periodic invested", value: result.periodic.totalInvested },
      { label: "Periodic net credit", value: result.periodic.netCredit },
    );
  }
  if (result.allLumpsum != null && result.allSip != null) {
    summaryItems.push(
      { label: "All lumpsum (today)", value: result.allLumpsum },
      { label: "All SIP (monthly)", value: result.allSip },
      { label: "Mix remaining SIP", value: result.mixSip ?? 0, highlight: true, tone: "gain" },
    );
  }

  return (
    <Stack>
      <GoalHero mode={mode} result={result} />
      <ResultsSplit
        left={
          <>
            {goalRequiredChart(mode, result)}
            {goalExtraChart(mode, result, tenureYears)}
          </>
        }
        right={
          <>
            <ResultCard
              title={result.overfunded ? "Results · already funded" : "Goal summary"}
              items={summaryItems}
            />
            {result.standard ? (
              <ResultCard
                title={mode === "sip" ? "Standard SIP" : "Additional SIP"}
                items={legItems(result.standard)}
              />
            ) : null}
            {result.stepUp ? (
              <ResultCard
                title={mode === "sip" ? "Step-up SIP" : "Additional step-up SIP"}
                items={legItems(result.stepUp)}
              />
            ) : null}
            {result.lumpsum?.lumpsum != null ? (
              <ResultCard title="Additional lumpsum today" items={legItems(result.lumpsum)} />
            ) : null}
          </>
        }
      />
      <ScheduleTable
        caption="Yearly schedule"
        meta={`${result.schedule.length} years`}
        zebra
        columns={scheduleColumns(mode)}
        rows={result.schedule}
      />
      {result.delays && result.delays.length > 0 ? (
        <ScheduleTable
          caption="Cost of delay"
          meta="Later start, higher SIP"
          columns={[
            { key: "months", header: "Delay (months)", sticky: true },
            {
              key: "sipRequired",
              header: "SIP required",
              format: "inr",
              align: "right",
              tone: "std",
            },
            {
              key: "extraInvested",
              header: "Extra invested",
              format: "inr",
              align: "right",
              tone: "warn",
            },
          ]}
          rows={result.delays}
        />
      ) : null}
    </Stack>
  );
}

function LsSipResults({
  result,
  tenureYears,
}: {
  result: GoalPlannerResult;
  tenureYears: number;
}) {
  const years = result.schedule.length || tenureYears;
  const mixSip = result.mixSip ?? 0;
  const allSip = result.allSip ?? 0;
  const allLumpsum = result.allLumpsum ?? 0;
  const standard = result.standard;

  return (
    <Stack>
      <StatGrid>
        <StatCard title="Target goal" value={result.targetGoal} />
        <StatCard title="Shortfall to fund" value={result.shortfall ?? 0} variant="soft" />
        <StatCard title="Mix monthly SIP" value={mixSip} />
      </StatGrid>

      <ResultsSplit
        left={
          <>
            {goalExtraChart("ls-sip", result, years)}
            {goalRequiredChart("ls-sip", result)}
          </>
        }
        right={
          <>
            <ResultCard
              title={result.overfunded ? "Results · already funded" : "Goal summary"}
              items={[
                {
                  label: "Target goal",
                  value: result.targetGoal,
                  highlight: true,
                  tone: "maturity",
                },
                { label: "Inflation-adjusted goal", value: result.inflAdjGoal },
                {
                  label: "Shortfall to fund",
                  value: result.shortfall ?? 0,
                  highlight: true,
                  tone: "delay",
                },
                { label: "Credit from current corpus", value: result.existingCredit ?? 0 },
                { label: "All lumpsum (today)", value: allLumpsum },
                { label: "All SIP (monthly)", value: allSip },
                {
                  label: "Mix remaining SIP",
                  value: mixSip,
                  highlight: true,
                  tone: "gain",
                },
              ]}
            />
            {standard ? <LegMetricCard title="Additional SIP" leg={standard} /> : null}
            {result.stepUp ? (
              <LegMetricCard title="Additional step-up SIP" leg={result.stepUp} />
            ) : null}
          </>
        }
      />

      <ScheduleTable
        caption="Yearly schedule"
        meta={`${result.schedule.length} years`}
        zebra
        columns={scheduleColumns("ls-sip")}
        rows={result.schedule}
      />
    </Stack>
  );
}

function PeriodicResults({
  result,
  tenureYears,
}: {
  result: GoalPlannerResult;
  tenureYears: number;
}) {
  const years = result.schedule.length || tenureYears;
  const periodic = result.periodic;
  const standard = result.standard;
  const stepUp = result.stepUp;
  const lumpsum = result.lumpsum;
  const shortfall = result.shortfall ?? 0;
  const periodicGain =
    periodic?.gain ??
    (periodic ? Math.max(0, periodic.maturity - periodic.totalInvested) : 0);
  const periodicTax =
    periodic?.tax ??
    (periodic ? Math.max(0, periodic.maturity - periodic.netCredit) : 0);

  return (
    <Stack>
      {result.overfunded ? (
        <StatusNote tone="info">
          Periodic investments already fund this goal. Additional SIP, step-up, and lumpsum are not
          required.
        </StatusNote>
      ) : null}

      <StatGrid>
        <StatCard title="Target goal" value={result.targetGoal} />
        <StatCard
          title={result.overfunded ? "Periodic net credit" : "Shortfall to fund"}
          value={result.overfunded ? (periodic?.netCredit ?? 0) : shortfall}
          variant="soft"
        />
        <StatCard
          title="Additional SIP · monthly"
          value={standard?.monthlySip ?? 0}
        />
        <StatCard title="Step-up SIP · start" value={stepUp?.monthlySip ?? 0} />
      </StatGrid>

      <ResultsSplit
        left={
          <>
            <div className="flex min-h-[260px] flex-1 flex-col sm:min-h-[300px]">
              {goalRequiredChart("periodic", result)}
            </div>
            {goalExtraChart("periodic", result, years)}
          </>
        }
        right={
          <>
            <ResultCard
              title={result.overfunded ? "Results · already funded" : "Goal summary"}
              items={[
                {
                  label: "Target goal",
                  value: result.targetGoal,
                  highlight: true,
                  tone: "maturity",
                },
                { label: "Inflation-adjusted goal", value: result.inflAdjGoal },
                {
                  label: "Shortfall to fund",
                  value: shortfall,
                  highlight: true,
                  tone: "delay",
                },
                { label: "Periodic maturity", value: periodic?.maturity ?? 0 },
                { label: "Periodic invested", value: periodic?.totalInvested ?? 0 },
                {
                  label: "Periodic gain",
                  value: periodicGain,
                  tone: "gain",
                },
                { label: "Periodic tax", value: periodicTax, tone: "tax" },
                {
                  label: "Periodic net credit",
                  value: periodic?.netCredit ?? 0,
                  highlight: true,
                  tone: "inflation",
                },
                {
                  label: "Periodic payments",
                  displayValue: String(periodic?.payments ?? 0),
                },
              ]}
            />
            {periodic ? (
              <div className="flex min-h-[240px] flex-1 flex-col">
                <CompositionChart
                  title="Periodic mix"
                  centerLabel="Maturity"
                  centerValue={periodic.maturity}
                  showPercentages
                  size="lg"
                  slices={[
                    {
                      name: "Periodic invested",
                      value: periodic.totalInvested,
                      color: "var(--app-chart-invested)",
                    },
                    {
                      name: "Periodic gain",
                      value: periodicGain,
                      color: "var(--app-chart-gain)",
                    },
                  ]}
                />
              </div>
            ) : null}
          </>
        }
      />

      <FundingPathsBoard
        muted={Boolean(result.overfunded)}
        lumpsum={lumpsum}
        standard={standard}
        stepUp={stepUp}
      />

      <ScheduleTable
        caption="Yearly schedule"
        meta={`${result.schedule.length} years · periodic + remaining SIP`}
        zebra
        highlightLastRow
        columns={scheduleColumns("periodic")}
        rows={result.schedule}
      />
    </Stack>
  );
}

function CurrentInvestmentResults({
  result,
  tenureYears,
}: {
  result: GoalPlannerResult;
  tenureYears: number;
}) {
  const years = result.schedule.length || tenureYears;
  const existing = result.existing;
  const standard = result.standard;
  const stepUp = result.stepUp;
  const lumpsum = result.lumpsum;

  return (
    <Stack>
      <StatGrid>
        <StatCard title="Target goal" value={result.targetGoal} />
        <StatCard title="Shortfall to fund" value={result.shortfall ?? 0} variant="soft" />
        <StatCard title="Additional SIP · monthly" value={standard?.monthlySip ?? 0} />
        <StatCard title="Step-up SIP · start" value={stepUp?.monthlySip ?? 0} />
      </StatGrid>

      <ResultsSplit
        left={
          <>
            {goalExtraChart("current", result, years)}
            {goalRequiredChart("current", result)}
          </>
        }
        right={
          <>
            <ResultCard
              title={result.overfunded ? "Results · already funded" : "Goal summary"}
              items={[
                {
                  label: "Target goal",
                  value: result.targetGoal,
                  highlight: true,
                  tone: "maturity",
                },
                { label: "Inflation-adjusted goal", value: result.inflAdjGoal },
                {
                  label: "Shortfall to fund",
                  value: result.shortfall ?? 0,
                  highlight: true,
                  tone: "delay",
                },
                {
                  label: "Existing net credit",
                  value: existing?.netCredit ?? 0,
                  tone: "inflation",
                },
                { label: "Existing corpus FV", value: existing?.corpusFv ?? 0 },
                { label: "Existing SIP FV", value: existing?.sipFv ?? 0 },
                {
                  label: "Additional SIP (monthly)",
                  value: standard?.monthlySip ?? 0,
                  highlight: true,
                  tone: "gain",
                },
                {
                  label: "Step-up SIP (start)",
                  value: stepUp?.monthlySip ?? 0,
                  tone: "inflation",
                },
                {
                  label: "Additional lumpsum today",
                  value: lumpsum?.lumpsum ?? 0,
                },
              ]}
            />
            {standard ? (
              <div className="flex min-h-[240px] flex-1 flex-col">
                <CompositionChart
                  title="Additional SIP mix"
                  centerLabel="Net"
                  centerValue={standard.netAfterTax}
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
                    {
                      name: "Tax",
                      value: standard.tax,
                      color: "var(--app-chart-tax)",
                    },
                  ]}
                />
              </div>
            ) : null}
          </>
        }
      />

      <FundingPathsBoard lumpsum={lumpsum} standard={standard} stepUp={stepUp} />

      <ScheduleTable
        caption="Yearly schedule"
        meta={`${result.schedule.length} years`}
        zebra
        columns={scheduleColumns("current")}
        rows={result.schedule}
      />
    </Stack>
  );
}

function ExistingSipResults({
  result,
  tenureYears,
  currentMonthlySip,
}: {
  result: GoalPlannerResult;
  tenureYears: number;
  currentMonthlySip: number;
}) {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const years = result.schedule.length || tenureYears;
  const existing = result.existing;
  const standard = result.standard;
  const stepUp = result.stepUp;
  const lumpsum = result.lumpsum;

  const sip1Invested = existing?.sipInvested ?? existing?.totalInvested ?? 0;
  const sip1Fv = existing?.sipFv ?? 0;
  const sip1Gain = Math.max(0, sip1Fv - sip1Invested);
  const sip2Invested = standard?.invested ?? 0;
  const sip2Gain = standard?.gain ?? 0;
  const sip2Tax = standard?.tax ?? 0;
  const sip2Net = standard?.netAfterTax ?? 0;
  const combinedCorpus = sip1Fv + (standard?.maturity ?? 0);

  return (
    <Stack>
      <StatGrid>
        <StatCard
          title="Target goal"
          value={result.targetGoal}
          hint="Net after capital gains tax"
        />
        <StatCard
          title="Existing SIP credit"
          value={existing?.netCredit ?? 0}
          hint="Keep current SIP running"
          variant="soft"
        />
        <StatCard
          title="Additional SIP"
          value={standard?.monthlySip ?? 0}
          hint="Extra flat monthly SIP"
        />
        <StatCard
          title="Step-up SIP"
          value={stepUp?.monthlySip ?? 0}
          hint="Starting monthly SIP"
          variant="soft"
          footer={
            stepUp?.endMonthlySip != null ? (
              <>
                Ending SIP after {years} years ·{" "}
                <span className="font-semibold tabular-nums text-[var(--app-primary-fg)]">
                  {formatINRCurrency(stepUp.endMonthlySip)}
                </span>
                /mo
              </>
            ) : undefined
          }
        />
      </StatGrid>

      {result.overfunded ? (
        <StatusNote tone="info">
          Existing SIP already covers the goal. Additional funding is not required.
        </StatusNote>
      ) : (
        <StatusNote tone="info">
          Shortfall to fund · {formatINRCurrency(result.shortfall ?? 0)}. Keep the current SIP of{" "}
          {formatINRCurrency(currentMonthlySip)}/mo and add one of the paths below.
        </StatusNote>
      )}

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 sm:p-4 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-text-muted)] sm:text-xs">
              {chartType === "pie"
                ? "Existing SIP vs additional SIP"
                : "Existing vs additional comparison"}
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
            <CompositionChart
              title="SIP1 + SIP2 corpus mix"
              centerLabel="Combined"
              centerValue={combinedCorpus}
              showPercentages
              size="lg"
              className="min-h-[280px] flex-1 sm:min-h-[300px]"
              slices={[
                {
                  name: "Existing invested",
                  value: sip1Invested,
                  color: "var(--app-chart-invested)",
                },
                {
                  name: "Existing gain",
                  value: sip1Gain,
                  color: "var(--app-chart-a)",
                },
                {
                  name: "Additional invested",
                  value: sip2Invested,
                  color: "var(--app-chart-b)",
                },
                {
                  name: "Additional gain",
                  value: sip2Gain,
                  color: "var(--app-chart-gain)",
                },
              ]}
              footer={
                standard ? (
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    <div className="flex items-baseline justify-between gap-2 rounded-md border border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] px-2.5 py-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-warn-text)]">
                        Add. tax
                      </div>
                      <div className="text-xs font-semibold tabular-nums text-[var(--app-warn-text-strong)]">
                        {formatINRCurrency(sip2Tax)}
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 rounded-md border border-[var(--app-step-text)]/25 bg-[var(--app-step-bg)] px-2.5 py-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
                        Add. net
                      </div>
                      <div className="text-xs font-semibold tabular-nums text-[var(--app-text)]">
                        {formatINRCurrency(sip2Net)}
                      </div>
                    </div>
                  </div>
                ) : undefined
              }
            />
          ) : (
            <CompareChart
              title="Existing vs additional SIP"
              showBarLabels
              className="min-h-[280px] flex-1 sm:min-h-[300px]"
              data={[
                {
                  category: "Monthly SIP",
                  existing: currentMonthlySip,
                  additional: standard?.monthlySip ?? 0,
                },
                {
                  category: "Invested",
                  existing: sip1Invested,
                  additional: sip2Invested,
                },
                {
                  category: "Corpus",
                  existing: sip1Fv,
                  additional: standard?.maturity ?? 0,
                },
              ]}
              series={[
                { key: "existing", label: "Existing", color: "var(--app-chart-a)" },
                { key: "additional", label: "Additional", color: "var(--app-chart-b)" },
              ]}
            />
          )}
        </div>

        <div className="flex h-full min-w-0 flex-col gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3.5 sm:p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--app-text-muted)] sm:text-xs">
            {result.overfunded ? "Results · already funded" : "Goal summary"}
          </h3>

          <div className="rounded-xl border border-[var(--app-step-text)]/20 bg-[var(--app-step-bg)] px-3.5 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
              Target goal
            </div>
            <div className="mt-1 text-xl font-bold tracking-tight tabular-nums text-[var(--app-text)] sm:text-2xl">
              {formatINRCurrency(result.targetGoal)}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] px-3.5 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-warn-text)]">
                Shortfall
              </span>
              <span className="text-sm font-bold tabular-nums text-[var(--app-warn-text-strong)] sm:text-base">
                {formatINRCurrency(result.shortfall ?? 0)}
              </span>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 content-stretch gap-2.5">
            <div className="flex flex-col justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--app-text-subtle)]">
                Existing credit
              </div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-[var(--app-std-text)]">
                {formatINRCurrency(existing?.netCredit ?? 0)}
              </div>
              <div className="mt-0.5 text-[10px] text-[var(--app-text-subtle)]">
                FV {formatINRCurrency(sip1Fv)}
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-[var(--app-step-text)]/25 bg-[var(--app-step-bg)] px-3 py-2.5">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--app-step-text)]">
                Additional SIP
              </div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-[var(--app-text)]">
                {formatINRCurrency(standard?.monthlySip ?? 0)}
                <span className="ml-0.5 text-[10px] font-medium text-[var(--app-text-muted)]">
                  /mo
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--app-text-subtle)]">
                Step-up SIP
              </div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-[var(--app-text)]">
                {formatINRCurrency(stepUp?.monthlySip ?? 0)}
                <span className="ml-0.5 text-[10px] font-medium text-[var(--app-text-muted)]">
                  /mo
                </span>
              </div>
              {stepUp?.endMonthlySip != null ? (
                <div className="mt-0.5 text-[10px] tabular-nums text-[var(--app-step-text)]">
                  Ends {formatINRCurrency(stepUp.endMonthlySip)}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2.5">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--app-text-subtle)]">
                Lumpsum today
              </div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-[var(--app-text)]">
                {formatINRCurrency(lumpsum?.lumpsum ?? 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <FundingPathsBoard lumpsum={lumpsum} standard={standard} stepUp={stepUp} />

      <ScheduleTable
        caption="Yearly schedule"
        meta={`${result.schedule.length} years · existing SIP + additional paths`}
        zebra
        highlightLastRow
        columns={scheduleColumns("existing")}
        rows={result.schedule}
      />
    </Stack>
  );
}

function FundingPathsBoard({
  lumpsum,
  standard,
  stepUp,
  muted = false,
}: {
  lumpsum?: GoalLeg | null;
  standard?: GoalLeg | null;
  stepUp?: GoalLeg | null;
  muted?: boolean;
}) {
  const paths = [
    lumpsum?.lumpsum != null
      ? {
          key: "lumpsum",
          eyebrow: "One-time",
          title: "Lumpsum today",
          primary: formatINRCurrency(lumpsum.lumpsum),
          primaryHint: "Pay once",
          secondary:
            lumpsum.monthlySip > 0
              ? `${formatINRCurrency(lumpsum.monthlySip)} / mo`
              : "No monthly SIP",
          leg: lumpsum,
        }
      : null,
    standard
      ? {
          key: "sip",
          eyebrow: "Level SIP",
          title: "Additional SIP",
          primary: formatINRCurrency(standard.monthlySip),
          primaryHint: "Every month",
          secondary: "Flat for the full tenure",
          leg: standard,
        }
      : null,
    stepUp
      ? {
          key: "step",
          eyebrow: "Growing SIP",
          title: "Step-up SIP",
          primary: formatINRCurrency(stepUp.monthlySip),
          primaryHint: "Starts at",
          secondary:
            stepUp.endMonthlySip != null
              ? `Ends at ${formatINRCurrency(stepUp.endMonthlySip)}`
              : "Rises each year",
          leg: stepUp,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    eyebrow: string;
    title: string;
    primary: string;
    primaryHint: string;
    secondary: string;
    leg: GoalLeg;
  }>;

  if (paths.length === 0) return null;

  const ranked = [...paths].sort((a, b) => a.leg.invested - b.leg.invested);
  const rankTone = new Map<string, { shell: string; badge: string; label: string }>();
  const tones = [
    {
      shell: "bg-[var(--app-step-bg)] border-[var(--app-step-text)]/25",
      badge: "bg-[var(--app-step-text)] text-white",
      label: "Least capital",
    },
    {
      shell: "bg-[var(--app-std-bg)] border-[var(--app-std-text)]/25",
      badge: "bg-[var(--app-std-text)] text-white",
      label: "Mid capital",
    },
    {
      shell: "bg-[var(--app-warn-bg)] border-[var(--app-warn-border)]",
      badge: "bg-[var(--app-warn-text)] text-white",
      label: "Most capital",
    },
  ];
  ranked.forEach((path, i) => {
    rankTone.set(path.key, tones[Math.min(i, tones.length - 1)]!);
  });

  return (
    <Card className={muted ? "opacity-70" : undefined}>
      <SectionHeader
        title="Ways to cover the shortfall"
        meta="Same net after tax · green needs the least capital"
      />
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        {paths.map((path) => {
          const tone = rankTone.get(path.key)!;
          const mix = [
            {
              key: "invested",
              label: "Invested",
              value: path.leg.invested,
              color: "var(--app-chart-invested)",
            },
            {
              key: "gain",
              label: "Gain",
              value: path.leg.gain,
              color: "var(--app-chart-gain)",
            },
            {
              key: "tax",
              label: "Tax",
              value: path.leg.tax,
              color: "var(--app-chart-tax)",
            },
          ];
          const mixTotal = mix.reduce((sum, part) => sum + Math.max(0, part.value), 0) || 1;

          return (
            <div
              key={path.key}
              className={`flex min-w-0 flex-col rounded-xl border p-3.5 sm:p-4 ${tone.shell}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className={MICRO_LABEL}>{path.eyebrow}</div>
                  <div className="mt-0.5 text-sm font-semibold text-[var(--app-text)]">
                    {path.title}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.badge}`}
                >
                  {tone.label}
                </span>
              </div>

              <div className="mt-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-subtle)]">
                  {path.primaryHint}
                </div>
                <div className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-[var(--app-text)] sm:text-2xl">
                  {path.primary}
                </div>
                <div className={`mt-0.5 ${META_TEXT}`}>{path.secondary}</div>
              </div>

              <div className="mt-3 rounded-lg bg-white/70 p-2.5">
                <div className={`${MICRO_LABEL} mb-2`}>Maturity mix</div>
                <div
                  className="flex h-3 overflow-hidden rounded-full"
                  title="Invested · Gain · Tax"
                >
                  {mix.map((part) => {
                    const pct = Math.max(0, part.value) / mixTotal;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={part.key}
                        className="h-full min-w-[3px] first:rounded-l-full last:rounded-r-full"
                        style={{
                          width: `${pct * 100}%`,
                          background: part.color,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  {mix.map((part) => {
                    const pct = Math.round((Math.max(0, part.value) / mixTotal) * 100);
                    return (
                      <div key={part.key} className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span
                            className="size-1.5 shrink-0 rounded-full"
                            style={{ background: part.color }}
                            aria-hidden
                          />
                          <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-muted)]">
                            {part.label}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[11px] font-semibold tabular-nums text-[var(--app-text)]">
                          {formatINRCurrency(part.value)}
                        </div>
                        <div className="text-[10px] tabular-nums text-[var(--app-text-subtle)]">
                          {pct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg bg-[var(--app-primary)] px-2.5 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--app-primary-fg-muted)]">
                  Net after tax
                </span>
                <span className="text-[12px] font-bold tabular-nums text-[var(--app-primary-fg)] sm:text-[13px]">
                  {formatINRCurrency(path.leg.netAfterTax)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function LegMetricCard({ title, leg }: { title: string; leg: GoalLeg }) {
  const rows = [
    { label: "Invested", value: leg.invested, tone: "text-[var(--app-text)]" },
    { label: "Gain", value: leg.gain, tone: "text-[var(--app-step-text)]" },
    { label: "Tax", value: leg.tax, tone: "text-[var(--app-danger)]" },
    {
      label: "Net after tax",
      value: leg.netAfterTax,
      tone: "font-bold text-[var(--app-step-text-strong)]",
    },
  ];
  const isLumpsum = leg.lumpsum != null;
  return (
    <Card className="h-full min-h-0">
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-1.5 text-sm font-semibold tabular-nums text-[var(--app-text)]">
        {isLumpsum ? "Lumpsum today " : "Monthly SIP "}
        <span className="text-[var(--app-step-text-strong)]">
          {formatINRCurrency(isLumpsum ? (leg.lumpsum ?? 0) : leg.monthlySip)}
        </span>
      </div>
      <div className="mt-3 grid flex-1 grid-cols-2 content-start gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-3 py-2"
          >
            <div className={MICRO_LABEL}>{row.label}</div>
            <div className={`mt-1 text-[13px] font-semibold tabular-nums ${row.tone}`}>
              {formatINRCurrency(row.value)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GoalHero({ mode, result }: { mode: Mode; result: GoalPlannerResult }) {
  if (mode === "sip" && result.standard && result.stepUp) {
    return (
      <StatGrid>
        <StatCard title="Standard SIP · monthly" value={result.standard.monthlySip} />
        <StatCard title="Step-up SIP · monthly" value={result.stepUp.monthlySip} variant="soft" />
      </StatGrid>
    );
  }
  if (result.standard) {
    return (
      <StatGrid>
        <StatCard title="Target goal" value={result.targetGoal} />
        <StatCard
          title={result.standard.lumpsum != null ? "Additional lumpsum" : "Additional SIP · monthly"}
          value={result.standard.lumpsum ?? result.standard.monthlySip}
          variant="soft"
        />
      </StatGrid>
    );
  }
  return (
    <StatGrid>
      <StatCard title="Target goal" value={result.targetGoal} />
      <StatCard title="Inflation-adjusted" value={result.inflAdjGoal} variant="soft" />
    </StatGrid>
  );
}

function investedTaxCorpus(legs: Array<{ key: string; label: string; color: string; leg: GoalLeg }>) {
  return {
    data: [
      Object.assign(
        { category: "Invested" },
        Object.fromEntries(legs.map((l) => [l.key, l.leg.invested])),
      ),
      Object.assign(
        { category: "Cap. gains tax" },
        Object.fromEntries(legs.map((l) => [l.key, l.leg.tax])),
      ),
      Object.assign(
        { category: "Corpus" },
        Object.fromEntries(legs.map((l) => [l.key, l.leg.maturity])),
      ),
    ] as Array<{ category: string; [k: string]: string | number }>,
    series: legs.map((l) => ({ key: l.key, label: l.label, color: l.color })),
  };
}

function goalRequiredChart(mode: Mode, result: GoalPlannerResult): ReactNode {
  if (mode === "sip" && result.standard && result.stepUp) {
    const { data, series } = investedTaxCorpus([
      { key: "sip", label: "SIP", color: "var(--app-chart-a)", leg: result.standard },
      { key: "step", label: "Step-up", color: "var(--app-chart-b)", leg: result.stepUp },
    ]);
    return <CompareChart title="SIP vs step-up" data={data} series={series} />;
  }

  if (mode === "current" && result.lumpsum && result.standard && result.stepUp && result.existing) {
    return (
      <WaterfallChart
        title="How the goal is funded"
        className="min-h-[300px] w-full flex-1 sm:min-h-[330px]"
        steps={[
          { label: "Existing credit", value: result.existing.netCredit, kind: "increase" },
          { label: "Additional", value: result.shortfall ?? 0, kind: "increase" },
          { label: "Target", value: result.targetGoal, kind: "total" },
        ]}
      />
    );
  }

  if (mode === "ls-sip" && result.standard) {
    return (
      <CompositionChart
        title="Mix: corpus / lumpsum / SIP"
        centerLabel="Mix"
        showPercentages
        size="lg"
        slices={[
          {
            name: "Current corpus credit",
            value: result.existingCredit ?? 0,
            color: "var(--app-chart-invested)",
          },
          {
            name: "Extra lumpsum",
            value: result.extraLumpsum ?? 0,
            color: "var(--app-chart-b)",
          },
          {
            name: "SIP invested",
            value: result.standard.invested,
            color: "var(--app-chart-invested)",
          },
          {
            name: "SIP gain",
            value: result.standard.gain,
            color: "var(--app-chart-gain)",
          },
          {
            name: "SIP tax",
            value: result.standard.tax,
            color: "var(--app-chart-tax)",
          },
        ]}
      />
    );
  }

  if (mode === "existing" && result.existing && result.standard) {
    return (
      <CompositionChart
        title="Existing SIP vs additional SIP"
        centerLabel="Corpus"
        centerValue={result.existing.sipFv + result.standard.maturity}
        compact
        slices={[
          {
            name: "SIP1 invested",
            value: result.existing.sipInvested ?? result.existing.totalInvested,
            color: "var(--app-chart-invested)",
          },
          {
            name: "SIP2 invested",
            value: result.standard.invested,
            color: "var(--app-chart-invested)",
          },
          {
            name: "SIP2 gain",
            value: result.standard.gain,
            color: "var(--app-chart-gain)",
          },
          {
            name: "SIP2 tax",
            value: result.standard.tax,
            color: "var(--app-chart-tax)",
          },
        ]}
      />
    );
  }

  if (mode === "periodic" && result.periodic) {
    return (
      <WaterfallChart
        title="How the goal is funded"
        className="min-h-[300px] w-full flex-1 sm:min-h-[330px]"
        steps={[
          {
            label: "Periodic credit",
            value: result.periodic.netCredit,
            kind: "increase",
          },
          {
            label: "Additional",
            value: result.shortfall ?? 0,
            kind: "increase",
          },
          { label: "Target", value: result.targetGoal, kind: "total" },
        ]}
      />
    );
  }

  if (mode === "compounding") {
    return (
      <GrowthChart
        title="SIP vs lumpsum growth steps"
        data={result.schedule.map((row) => ({
          year: row.year,
          sip: row.sipYearEnd ?? 0,
          lumpsum: row.lumpsumEnd ?? 0,
        }))}
        series={[
          { key: "sip", label: "SIP year-end", color: "var(--app-chart-invested)" },
          { key: "lumpsum", label: "Lumpsum year-end", color: "var(--app-chart-gain)" },
        ]}
      />
    );
  }

  return null;
}

function goalExtraChart(mode: Mode, result: GoalPlannerResult, tenureYears = 15): ReactNode {
  if (mode === "sip") {
    return null;
  }

  if (mode === "current" && result.existing && result.lumpsum && result.standard && result.stepUp) {
    const years = result.schedule.length || tenureYears;
    const sipTotal = result.standard.invested;
    const stepTotal = result.stepUp.invested;
    const lsToday = result.lumpsum.lumpsum ?? 0;
    return (
      <CompareChart
        title="Total capital · Extra LS vs SIP vs step-up"
        showBarLabels
        showLegend={false}
        className="min-h-[300px] w-full flex-1 sm:min-h-[330px]"
        data={[
          {
            category: "Extra lumpsum",
            sublabel: "One-time today",
            amount: lsToday,
            fill: "var(--app-chart-a)",
          },
          {
            category: "Extra SIP",
            sublabel: `${formatINRCurrency(result.standard.monthlySip)}/mo × ${years}y`,
            amount: sipTotal,
            fill: "var(--app-chart-b)",
          },
          {
            category: "Extra step-up",
            sublabel: `${formatINRCurrency(result.stepUp.monthlySip)}/mo start`,
            amount: stepTotal,
            fill: "var(--app-chart-gain)",
          },
        ]}
        series={[{ key: "amount", label: "Total capital", color: "var(--app-chart-invested)" }]}
      />
    );
  }

  if (mode === "ls-sip" && result.allLumpsum != null && result.allSip != null) {
    const years = result.schedule.length || tenureYears;
    const allSipTotal = result.allSip * 12 * years;
    const mixSipTotal = (result.mixSip ?? 0) * 12 * years;
    const mixTotal = (result.extraLumpsum ?? 0) + mixSipTotal;
    return (
      <CompareChart
        title="Total capital · All-LS vs All-SIP vs Mix"
        showBarLabels
        showLegend={false}
        className="min-h-[300px] w-full flex-1 sm:min-h-[330px]"
        data={[
          {
            category: "All lumpsum",
            sublabel: "One-time today",
            amount: result.allLumpsum,
            fill: "var(--app-chart-a)",
          },
          {
            category: "All SIP",
            sublabel: `${formatINRCurrency(result.allSip)}/mo × ${years}y`,
            amount: allSipTotal,
            fill: "var(--app-chart-b)",
          },
          {
            category: "Mix",
            sublabel: `LS + ${formatINRCurrency(result.mixSip ?? 0)}/mo`,
            amount: mixTotal,
            fill: "var(--app-chart-gain)",
          },
        ]}
        series={[{ key: "amount", label: "Total capital", color: "var(--app-chart-invested)" }]}
      />
    );
  }

  if (mode === "existing" && result.existing && result.standard) {
    return (
      <CompareChart
        title="Existing vs additional SIP"
        data={[
          {
            category: "Invested",
            existing: result.existing.totalInvested,
            additional: result.standard.invested,
          },
          {
            category: "Corpus",
            existing: result.existing.sipFv,
            additional: result.standard.maturity,
          },
        ]}
        series={[
          { key: "existing", label: "Existing", color: "var(--app-chart-a)" },
          { key: "additional", label: "Additional", color: "var(--app-chart-b)" },
        ]}
      />
    );
  }

  if (mode === "periodic" && result.standard && result.stepUp) {
    return (
      <CompareChart
        title="Remaining SIP vs step-up"
        className="min-h-[300px] w-full flex-1 sm:min-h-[330px]"
        data={[
          {
            category: "Invested",
            sip: result.standard.invested,
            step: result.stepUp.invested,
          },
          {
            category: "Corpus",
            sip: result.standard.maturity,
            step: result.stepUp.maturity,
          },
        ]}
        series={[
          { key: "sip", label: "Remaining SIP", color: "var(--app-chart-a)" },
          { key: "step", label: "Remaining step-up", color: "var(--app-chart-b)" },
        ]}
      />
    );
  }

  if (mode === "compounding" && result.standard) {
    return (
      <CompositionChart
        title="SIP at goal year"
        centerLabel="Corpus"
        centerValue={result.standard.maturity}
        slices={[
          { name: "Invested", value: result.standard.invested, color: "var(--app-chart-invested)" },
          { name: "Gain", value: result.standard.gain, color: "var(--app-chart-gain)" },
        ]}
      />
    );
  }

  return null;
}

function legItems(leg: GoalLeg) {
  const items = [];
  if (leg.lumpsum != null) items.push({ label: "Lumpsum", value: leg.lumpsum });
  items.push({ label: "Monthly SIP", value: leg.monthlySip });
  if (leg.endMonthlySip != null) items.push({ label: "End SIP", value: leg.endMonthlySip });
  items.push(
    { label: "Invested", value: leg.invested },
    { label: "Maturity", value: leg.maturity },
    { label: "Gain", value: leg.gain },
    { label: "Tax", value: leg.tax },
    { label: "Net after tax", value: leg.netAfterTax },
  );
  return items;
}

function scheduleColumns(mode: Mode) {
  if (mode === "sip") {
    return [
      { key: "year", header: "Year", sticky: true },
      {
        key: "stdMonthly",
        header: "Std SIP",
        format: "inr" as const,
        align: "right" as const,
        tone: "std" as const,
      },
      {
        key: "stdYearEnd",
        header: "Std end",
        format: "inr" as const,
        align: "right" as const,
        tone: "std" as const,
      },
      {
        key: "stepMonthly",
        header: "Step SIP",
        format: "inr" as const,
        align: "right" as const,
        tone: "step" as const,
      },
      {
        key: "stepYearEnd",
        header: "Step end",
        format: "inr" as const,
        align: "right" as const,
        tone: "step" as const,
      },
    ];
  }
  if (mode === "compounding") {
    return [
      { key: "year", header: "Year", sticky: true },
      {
        key: "sipMonthly",
        header: "Monthly SIP",
        format: "inr" as const,
        align: "right" as const,
        tone: "std" as const,
      },
      {
        key: "sipYearEnd",
        header: "SIP year-end",
        format: "inr" as const,
        align: "right" as const,
        tone: "std" as const,
      },
      {
        key: "lumpsumEnd",
        header: "Lumpsum year-end",
        format: "inr" as const,
        align: "right" as const,
        tone: "step" as const,
      },
    ];
  }
  if (mode === "ls-sip") {
    return [
      { key: "year", header: "Year", sticky: true },
      {
        key: "extraLumpEnd",
        header: "Extra LS",
        format: "inr" as const,
        align: "right" as const,
        tone: "warn" as const,
      },
      {
        key: "sipMonthly",
        header: "Mix SIP",
        format: "inr" as const,
        align: "right" as const,
        tone: "std" as const,
      },
      {
        key: "sipYearEnd",
        header: "SIP end",
        format: "inr" as const,
        align: "right" as const,
        tone: "std" as const,
      },
      {
        key: "combinedEnd",
        header: "Combined",
        format: "inr" as const,
        align: "right" as const,
        tone: "step" as const,
      },
    ];
  }
  if (mode === "periodic") {
    return [
      { key: "year", header: "Year", sticky: true },
      {
        key: "periodicPaid",
        header: "Periodic paid",
        format: "inr" as const,
        align: "right" as const,
        tone: "warn" as const,
      },
      {
        key: "periodicInvestedYtd",
        header: "Periodic YTD",
        format: "inr" as const,
        align: "right" as const,
        tone: "warn" as const,
      },
      {
        key: "sipMonthly",
        header: "Add. SIP (mo)",
        format: "inr" as const,
        align: "right" as const,
        tone: "std" as const,
      },
      {
        key: "sipYearEnd",
        header: "SIP end",
        format: "inr" as const,
        align: "right" as const,
        tone: "std" as const,
      },
      {
        key: "stepMonthly",
        header: "Step SIP (mo)",
        format: "inr" as const,
        align: "right" as const,
        tone: "step" as const,
      },
      {
        key: "stepYearEnd",
        header: "Step end",
        format: "inr" as const,
        align: "right" as const,
        tone: "step" as const,
      },
    ];
  }
  if (mode === "current" || mode === "existing") {
    return [
      { key: "year", header: "Year", sticky: true },
      {
        key: "existingEnd",
        header: "Existing",
        format: "inr" as const,
        align: "right" as const,
        tone: "warn" as const,
      },
      {
        key: "sipMonthly",
        header: "Add. SIP",
        format: "inr" as const,
        align: "right" as const,
        tone: "std" as const,
      },
      {
        key: "sipYearEnd",
        header: "SIP end",
        format: "inr" as const,
        align: "right" as const,
        tone: "std" as const,
      },
      {
        key: "stepMonthly",
        header: "Step SIP",
        format: "inr" as const,
        align: "right" as const,
        tone: "step" as const,
      },
      {
        key: "stepYearEnd",
        header: "Step end",
        format: "inr" as const,
        align: "right" as const,
        tone: "step" as const,
      },
      {
        key: "combinedSipEnd",
        header: "Combined",
        format: "inr" as const,
        align: "right" as const,
        tone: "step" as const,
      },
    ];
  }
  return [
    { key: "year", header: "Year", sticky: true },
    {
      key: "existingEnd",
      header: "Existing",
      format: "inr" as const,
      align: "right" as const,
      tone: "warn" as const,
    },
    {
      key: "sipMonthly",
      header: "Add. SIP",
      format: "inr" as const,
      align: "right" as const,
      tone: "std" as const,
    },
    {
      key: "sipYearEnd",
      header: "SIP end",
      format: "inr" as const,
      align: "right" as const,
      tone: "std" as const,
    },
    {
      key: "combinedSipEnd",
      header: "Combined",
      format: "inr" as const,
      align: "right" as const,
      tone: "step" as const,
    },
  ];
}
