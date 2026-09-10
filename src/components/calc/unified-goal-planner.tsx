"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateCalculatorReport, generatePdfFromElement } from "@/lib/pdf-generator";
import { playbookForPdf } from "@/lib/report-playbooks";
import {
  ClientHeader,
  CompareChart,
  CompositionChart,
  formatINRCurrency,
  GrowthChart,
  MoneyInput,
  PercentInput,
  ResultCard,
  type ResultItem,
  RESULTS_LEFT,
  RESULTS_RIGHT,
  RESULTS_SPLIT,
  ScheduleTable,
  SelectInput,
  StatCard,
  WaterfallChart,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
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

const FORM_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] items-start gap-x-3 gap-y-3";

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
  sipAfterExtra?: number;
  lumpsumAfterExtra?: number;
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
  const [name, setName] = useState("Mr. John Doe");
  const [age, setAge] = useState(30);
  const [goalAmount, setGoalAmount] = useState(10_000_000);
  const [tenureYears, setTenureYears] = useState(15);
  const [returnPct, setReturnPct] = useState(12);
  const [inflationPct, setInflationPct] = useState(5.25);
  const [taxPct, setTaxPct] = useState(12.5);
  const [stepUpPct, setStepUpPct] = useState(10);
  const [useInflAdj, setUseInflAdj] = useState(true);
  const [currentCorpus, setCurrentCorpus] = useState(500_000);
  const [currentMonthlySip, setCurrentMonthlySip] = useState(5_000);
  const [extraLumpsum, setExtraLumpsum] = useState(200_000);
  const [periodicAmount, setPeriodicAmount] = useState(100_000);
  const [timesPerYear, setTimesPerYear] = useState(2);
  const [extraYears, setExtraYears] = useState(5);

  const nameError = !name.trim() ? "Client Name required." : undefined;
  const ageError =
    age < 18 || age > 100 ? "Enter a valid age." : undefined;
  const goalError = goalAmount <= 0 ? "Enter your goal amount." : undefined;
  const tenureError =
    tenureYears < 1 || tenureYears > 50 ? "Tenure should be between 1 and 50 years." : undefined;
  const returnError =
    returnPct < 0 || returnPct > 30 ? "Enter a valid expected return percentage." : undefined;
  const inflationError =
    inflationPct < 0 || inflationPct > 20 ? "Inflation should be between 0 and 20%." : undefined;
  const taxError = taxPct < 0 || taxPct > 100 ? "Tax should be between 0 and 100%." : undefined;
  const stepUpError =
    stepUpPct < 0 || stepUpPct > 100 ? "Step-up should be between 0 and 100%." : undefined;
  const corpusError = currentCorpus < 0 ? "Corpus cannot be negative." : undefined;
  const currentSipError = currentMonthlySip < 0 ? "Current SIP cannot be negative." : undefined;
  const extraLsError = extraLumpsum < 0 ? "Extra lumpsum cannot be negative." : undefined;

  const canCalculate =
    !nameError &&
    !ageError &&
    !goalError &&
    !tenureError &&
    !returnError &&
    !inflationError &&
    !taxError &&
    (mode === "compounding" ? true : !stepUpError) &&
    (mode !== "current" && mode !== "ls-sip" ? true : !corpusError) &&
    (mode !== "current" && mode !== "existing" ? true : !currentSipError) &&
    (mode !== "ls-sip" ? true : !extraLsError);

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
        return { ...base, extraYears };
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
    extraYears,
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
        ...(mode === "compounding"
          ? ([["Extra Years", extraYears]] as Array<[string, string | number, boolean?]>)
          : []),
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
      description="Six goal modes. Additional SIP / lumpsum / step-up are solved so net after tax hits the goal."
      actions={
        <Button
          size="icon"
          className="h-8 w-8 shrink-0 bg-[var(--app-primary)] text-[var(--app-primary-fg)] hover:bg-[var(--app-primary-hover)] transition-colors"
          onClick={handleDownload}
          title={isDownloading ? "Preparing PDF…" : "Download Report"}
          disabled={!result || isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
        </Button>
      }
      form={
        <div className={FORM_GRID}>
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
          {mode !== "compounding" ? (
            <PercentInput
              label="Step-up (%)"
              value={stepUpPct}
              onChange={setStepUpPct}
              error={stepUpError}
              hint="Annual SIP Increase"
            />
          ) : (
            <YearInput label="Extra years" value={extraYears} min={0} max={50} onChange={setExtraYears} />
          )}
          <div className="col-span-2 min-w-0 sm:col-span-2">
            <SelectInput
              label="Goal basis"
              value={useInflAdj ? "infl" : "raw"}
              onChange={(value) => setUseInflAdj(value === "infl")}
              className="min-w-0 w-full"
              options={[
                { value: "raw", label: "Stated goal" },
                { value: "infl", label: "Inflation-adjusted Goal" },
              ]}
            />
          </div>
          {mode === "current" || mode === "ls-sip" ? (
            <MoneyInput
              label="Current corpus"
              value={currentCorpus}
              onChange={setCurrentCorpus}
              error={corpusError}
              align="right"
            />
          ) : null}
          {mode === "current" || mode === "existing" ? (
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
          {mode === "periodic" ? (
            <>
              <MoneyInput label="Periodic amt" value={periodicAmount} onChange={setPeriodicAmount} align="right" />
              <SelectInput
                label="Freq / yr"
                value={String(timesPerYear)}
                onChange={(value) => setTimesPerYear(Number(value))}
                options={FREQUENCY_OPTIONS}
                hint="Must divide 12"
              />
            </>
          ) : null}
        </div>
      }
      results={
        <div className="flex flex-col gap-4">
          {error ? <p className="text-sm text-[var(--app-danger)]">{error}</p> : null}
          {!canCalculate ? (
            <p className="text-sm text-[var(--app-warn-text)]">Fix the highlighted inputs to calculate.</p>
          ) : null}
          {loading && !result ? (
            <p className="text-sm text-[var(--app-text-muted)]">Calculating…</p>
          ) : null}
          {result ? <GoalResults mode={mode} result={result} tenureYears={tenureYears} /> : null}
        </div>
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
    </>
  );
}

function GoalResults({
  mode,
  result,
  tenureYears,
}: {
  mode: Mode;
  result: GoalPlannerResult;
  tenureYears: number;
}) {
  if (mode === "ls-sip") {
    return <LsSipResults result={result} tenureYears={tenureYears} />;
  }
  if (mode === "current") {
    return <CurrentInvestmentResults result={result} tenureYears={tenureYears} />;
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
  if (result.sipAfterExtra != null && result.lumpsumAfterExtra != null) {
    summaryItems.push(
      { label: `SIP after +${result.extraYears ?? 0}y`, value: result.sipAfterExtra },
      { label: `Lumpsum after +${result.extraYears ?? 0}y`, value: result.lumpsumAfterExtra },
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className={RESULTS_SPLIT}>
        <div className={RESULTS_LEFT}>
          <GoalHero mode={mode} result={result} />
          <div className="flex flex-1 flex-col gap-4">
            {goalRequiredChart(mode, result)}
            {goalExtraChart(mode, result, tenureYears)}
          </div>
        </div>
        <div className={RESULTS_RIGHT}>
          <div className="flex flex-col gap-4">
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
          </div>
        </div>
      </div>
      <ScheduleTable
        caption="Yearly schedule"
        zebra
        columns={scheduleColumns(mode)}
        rows={result.schedule}
      />
      {result.delays && result.delays.length > 0 ? (
        <ScheduleTable
          className="max-h-[160px] min-h-[120px] flex-none"
          caption="Cost of delay"
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
    </div>
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
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-3">
        <StatCard title="Target goal" value={result.targetGoal} size="lg" />
        <StatCard
          title="Shortfall to fund"
          value={result.shortfall ?? 0}
          variant="soft"
          size="lg"
        />
        <StatCard title="Mix monthly SIP" value={mixSip} size="lg" />
      </div>

      <div className={RESULTS_SPLIT}>
        <div className={RESULTS_LEFT}>
          <div className="flex flex-1 flex-col gap-4">
            {goalExtraChart("ls-sip", result, years)}
            {goalRequiredChart("ls-sip", result)}
          </div>
        </div>
        <div className={RESULTS_RIGHT}>
          <div className="flex flex-col gap-4">
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
          </div>
        </div>
      </div>

      <ScheduleTable
        caption="Yearly schedule"
        zebra
        columns={scheduleColumns("ls-sip")}
        rows={result.schedule}
      />
    </div>
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
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Target goal" value={result.targetGoal} size="lg" />
        <StatCard
          title="Shortfall to fund"
          value={result.shortfall ?? 0}
          variant="soft"
          size="lg"
        />
        <StatCard
          title="Additional SIP · monthly"
          value={standard?.monthlySip ?? 0}
          size="lg"
        />
        <StatCard
          title="Step-up SIP · start"
          value={stepUp?.monthlySip ?? 0}
          size="lg"
        />
      </div>

      <div className={`${RESULTS_SPLIT} lg:items-stretch`}>
        <div className={`${RESULTS_LEFT} min-h-0`}>
          <div className="flex h-full flex-col gap-4">
            {goalExtraChart("current", result, years)}
            {goalRequiredChart("current", result)}
          </div>
        </div>
        <div className={`${RESULTS_RIGHT} min-h-0`}>
          <div className="flex h-full min-h-0 flex-col gap-4">
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
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
        {lumpsum?.lumpsum != null ? (
          <LegMetricCard title="Additional lumpsum today" leg={lumpsum} />
        ) : null}
        {standard ? <LegMetricCard title="Additional SIP" leg={standard} /> : null}
        {stepUp ? <LegMetricCard title="Additional step-up SIP" leg={stepUp} /> : null}
      </div>

      <ScheduleTable
        caption="Yearly schedule"
        zebra
        columns={scheduleColumns("current")}
        rows={result.schedule}
      />
    </div>
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
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 sm:p-3.5">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--app-text-muted)]">
        {title}
      </div>
      <div className="mt-2 text-sm font-semibold tabular-nums text-[var(--app-text)]">
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
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
              {row.label}
            </div>
            <div className={`mt-1 text-sm tabular-nums ${row.tone}`}>
              {formatINRCurrency(row.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalHero({ mode, result }: { mode: Mode; result: GoalPlannerResult }) {
  if (mode === "sip" && result.standard && result.stepUp) {
    return (
      <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
        <StatCard title="Standard SIP · monthly" value={result.standard.monthlySip} />
        <StatCard title="Step-up SIP · monthly" value={result.stepUp.monthlySip} variant="soft" />
      </div>
    );
  }
  if (result.standard) {
    return (
      <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
        <StatCard title="Target goal" value={result.targetGoal} />
        <StatCard
          title={result.standard.lumpsum != null ? "Additional lumpsum" : "Additional SIP · monthly"}
          value={result.standard.lumpsum ?? result.standard.monthlySip}
          variant="soft"
        />
      </div>
    );
  }
  return (
    <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
      <StatCard title="Target goal" value={result.targetGoal} />
      <StatCard title="Inflation-adjusted" value={result.inflAdjGoal} variant="soft" />
    </div>
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
      { key: "sip", label: "SIP", color: "var(--app-chart-invested)", leg: result.standard },
      { key: "step", label: "Step-up", color: "var(--app-chart-gain)", leg: result.stepUp },
    ]);
    return <CompareChart title="SIP vs step-up" data={data} series={series} />;
  }

  if (mode === "current" && result.lumpsum && result.standard && result.stepUp && result.existing) {
    return (
      <WaterfallChart
        title="How the goal is funded"
        className="h-[320px] w-full shrink-0 sm:h-[360px]"
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
            color: "var(--app-std-text)",
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
      <CompositionChart
        title="Periodic mix"
        centerLabel="Maturity"
        centerValue={result.periodic.maturity}
        slices={[
          {
            name: "Periodic invested",
            value: result.periodic.totalInvested,
            color: "var(--app-chart-invested)",
          },
          {
            name: "Periodic net credit",
            value: result.periodic.netCredit,
            color: "var(--app-chart-gain)",
          },
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
        className="h-[320px] w-full shrink-0 sm:h-[360px]"
        data={[
          {
            category: "Extra lumpsum",
            sublabel: "One-time today",
            amount: lsToday,
            fill: "var(--app-chart-invested)",
          },
          {
            category: "Extra SIP",
            sublabel: `${formatINRCurrency(result.standard.monthlySip)}/mo × ${years}y`,
            amount: sipTotal,
            fill: "var(--app-chart-gain)",
          },
          {
            category: "Extra step-up",
            sublabel: `${formatINRCurrency(result.stepUp.monthlySip)}/mo start`,
            amount: stepTotal,
            fill: "var(--app-std-text)",
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
        className="h-[320px] w-full shrink-0 sm:h-[360px]"
        data={[
          {
            category: "All lumpsum",
            sublabel: "One-time today",
            amount: result.allLumpsum,
            fill: "var(--app-chart-invested)",
          },
          {
            category: "All SIP",
            sublabel: `${formatINRCurrency(result.allSip)}/mo × ${years}y`,
            amount: allSipTotal,
            fill: "var(--app-chart-gain)",
          },
          {
            category: "Mix",
            sublabel: `LS + ${formatINRCurrency(result.mixSip ?? 0)}/mo`,
            amount: mixTotal,
            fill: "var(--app-std-text)",
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
          { key: "existing", label: "Existing", color: "var(--app-chart-invested)" },
          { key: "additional", label: "Additional", color: "var(--app-chart-gain)" },
        ]}
      />
    );
  }

  if (mode === "periodic" && result.standard && result.stepUp) {
    return (
      <CompareChart
        title="Remaining SIP vs step-up"
        data={[
          {
            category: "Monthly",
            sip: result.standard.monthlySip,
            step: result.stepUp.monthlySip,
          },
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
          { key: "sip", label: "Remaining SIP", color: "var(--app-chart-invested)" },
          { key: "step", label: "Remaining step-up", color: "var(--app-chart-gain)" },
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
    ];
  }
  if (mode === "current") {
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
