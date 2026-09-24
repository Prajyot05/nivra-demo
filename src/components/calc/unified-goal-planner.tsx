"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { generateCalculatorReport, generatePdfFromElement } from "@/lib/pdf-generator";
import { playbookForPdf } from "@/lib/report-playbooks";
import {
  ageError,
  emailError,
  formatINRCurrency,
  formatPercent,
  nameError,
  phoneError,
  rateError,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import {
  CompoundingAnalytics,
  CompoundingSchedule,
} from "@/components/calc/goal-compounding-results";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import { useCalculate } from "@/hooks/use-calculate";
import { useCalculatorMode } from "@/hooks/use-calculator-mode";
import { getCalculatorPageDescription, getCalculatorPageTitle } from "@/lib/calculator-nav";
import {
  DelayCostCards,
  IconCalendar,
  IconChart,
  IconDelay,
  IconDonut,
  IconPerson,
  IconRates,
  IconRefresh,
  IconSip,
  IconStepUp,
  IconTarget,
  moneyCell,
  WEALTH_CONTENT_CLASS,
  WealthAgeField,
  WealthAuditChip,
  WealthAuditLedger,
  WealthDataTable,
  WealthLedgerShell,
  wealthLedgerTheadClass,
  WealthDisclaimer,
  WealthHero,
  WealthIconMark,
  WealthMetricCard,
  WealthMoneyField,
  WealthPercentField,
  WealthProfileGrid,
  WealthSection,
  WealthSegmented,
  WealthSelectField,
  WealthStatusNote,
  WealthTextField,
  WealthYearField,
  WealthAnalyticsChrome,
  WealthCompareBars,
  WealthGrowthLine,
  WealthMixDonut,
  WealthWaterfallBars,
  wealthChart,
  wealthMixColors,
  type WealthAuditRow,
  type WealthTableColumn,
  WEALTH_GOAL_PRESETS_DEFAULT,
  WEALTH_MONEY_PRESETS_DEFAULT,
  WEALTH_YEAR_PRESETS_DEFAULT,
} from "@/components/wealth";

const GOAL_AMOUNT_MIN = 10_000;
const GOAL_AMOUNT_MAX = 10_00_00_000;
const SIP_AMOUNT_MIN = 1_000;
const SIP_AMOUNT_MAX = 10_00_000;
const SIP_AMOUNT_PRESETS = [
  { label: "₹5k", value: 5_000 },
  { label: "₹10k", value: 10_000 },
  { label: "₹25k", value: 25_000 },
  { label: "₹50k", value: 50_000 },
  { label: "₹1L", value: 1_00_000 },
  { label: "₹2L", value: 2_00_000 },
];
const CORPUS_AMOUNT_MIN = 10_000;
const CORPUS_AMOUNT_MAX = 10_00_00_000;
const YEARS_SLIDER_MAX = 40;
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

const MODE_META = [
  { id: "sip", label: "SIP vs Step", fullLabel: "SIP vs Step-up" },
  { id: "current", label: "Current", fullLabel: "Current investment" },
  { id: "ls-sip", label: "LS + SIP", fullLabel: "LS + SIP options" },
  { id: "existing", label: "Existing", fullLabel: "Existing SIP" },
  { id: "periodic", label: "Periodic", fullLabel: "Periodic lumpsum" },
  { id: "compounding", label: "Steps", fullLabel: "Growth steps" },
] as const;

type Mode = (typeof MODE_META)[number]["id"];
const MODE_IDS = MODE_META.map((m) => m.id);
const MODE_FULL_LABEL: Record<Mode, string> = Object.fromEntries(
  MODE_META.map((m) => [m.id, m.fullLabel]),
) as Record<Mode, string>;

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
  const [mode, setMode] = useCalculatorMode(MODE_IDS, "current");
  const compoundingLanding = mode === "compounding";
  const [name, setName] = useState("Mr. John Doe");
  const [age, setAge] = useState(30);
  const [email, setEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [phone, setPhone] = useState(DUMMY_REPORT_CONTACT.phone);
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

  const [openAssumptions, setOpenAssumptions] = useState(true);
  const [openMilestones, setOpenMilestones] = useState(true);
  const [openAnalytics, setOpenAnalytics] = useState(true);
  const [openSchedule, setOpenSchedule] = useState(true);
  const [openDelay, setOpenDelay] = useState(true);
  const [chartTab, setChartTab] = useState<"funding" | "compare">("funding");
  const assumptionsRef = useRef<HTMLDivElement>(null);

  const clientNameError = nameError(name);
  const clientAgeError = ageError(age);
  const clientEmailError = emailError(email);
  const clientPhoneError = phoneError(phone);
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
  const taxError = rateError(taxPct, "Tax");
  const stepUpError = rateError(stepUpPct, "Step-up");
  const corpusError = currentCorpus < 0 ? "Corpus cannot be negative." : undefined;
  const currentSipError = currentMonthlySip < 0 ? "Current SIP cannot be negative." : undefined;
  const extraLsError = extraLumpsum < 0 ? "Extra lumpsum cannot be negative." : undefined;
  const periodicAmountError =
    mode === "periodic" && periodicAmount <= 0
      ? "Periodic investment amount is required."
      : undefined;

  const fieldErrors = [
    clientNameError,
    clientAgeError,
    clientEmailError,
    clientPhoneError,
    goalError,
    tenureError,
    returnError,
    mode === "compounding" ? undefined : inflationError,
    taxError,
    mode === "compounding" ? undefined : stepUpError,
    mode === "current" || mode === "ls-sip" ? corpusError : undefined,
    mode === "current" || mode === "existing" ? currentSipError : undefined,
    mode === "ls-sip" ? extraLsError : undefined,
    mode === "periodic" ? periodicAmountError : undefined,
  ].filter((msg): msg is string => Boolean(msg));

  const canCalculate = fieldErrors.length === 0;

  const resetDefaults = () => {
    setName("Mr. John Doe");
    setAge(30);
    setEmail(DUMMY_REPORT_CONTACT.email);
    setPhone(DUMMY_REPORT_CONTACT.phone);
    setGoalAmount(compoundingLanding ? 5_000_000 : 10_000_000);
    setTenureYears(15);
    setReturnPct(compoundingLanding ? 14 : 12);
    setInflationPct(5.25);
    setTaxPct(12.5);
    setStepUpPct(10);
    setUseInflAdj(!compoundingLanding);
    setCurrentCorpus(500_000);
    setCurrentMonthlySip(5_000);
    setExtraLumpsum(200_000);
    setPeriodicAmount(100_000);
    setTimesPerYear(2);
    setInvestmentType("one-time");
    setStepSize(1_000_000);
  };

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

    const modeLabel = MODE_FULL_LABEL[mode] ?? String(mode);

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


  const realReturnPct = ((1 + returnPct / 100) / (1 + inflationPct / 100) - 1) * 100;

  const scrollToAssumptions = () => {
    setOpenAssumptions(true);
    assumptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const heroMonthlySip = (() => {
    if (!result) return 0;
    if (mode === "sip") return result.stepUp?.monthlySip ?? result.standard?.monthlySip ?? 0;
    if (mode === "ls-sip") return result.mixSip ?? 0;
    if (mode === "compounding") return result.standard?.monthlySip ?? 0;
    return result.standard?.monthlySip ?? 0;
  })();

  const heroTarget = canCalculate && result ? result.targetGoal : goalAmount;

  return (
    <>
    <CalculatorPage
      title={getCalculatorPageTitle("/goals", mode)}
      description={getCalculatorPageDescription("/goals", mode)}
      contentClassName={WEALTH_CONTENT_CLASS}
      actions={
        <ReportDownloadButton
          onClick={handleDownload}
          disabled={!result}
          loading={isDownloading}
        />
      }
      header={
        <WealthHero
          clientName={name}
          age={age}
          email={email}
          phone={phone}
          goalLabel={
            mode === "compounding"
              ? "Capital Growth"
              : useInflAdj
                ? "Inflation-Adjusted"
                : "Stated Goal"
          }
          tenure={tenureYears}
          strategy={MODE_FULL_LABEL[mode]}
          targetCorpus={heroTarget}
          monthlySip={canCalculate ? heroMonthlySip : 0}
          realReturnPct={realReturnPct}
          onEdit={scrollToAssumptions}
        />
      }
      form={
        <div ref={assumptionsRef}>
          <WealthSection
            id="assumptions"
            badge="01 · Profile"
            title="Investor Profile and Assumptions"
            subtitle="Client identity, goal mode inputs, tenure, and market rate settings"
            open={openAssumptions}
            onToggle={() => setOpenAssumptions((v) => !v)}
            mark={
              <WealthIconMark>
                <IconPerson />
              </WealthIconMark>
            }
            actions={
              <button
                type="button"
                onClick={resetDefaults}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <IconRefresh className="h-3.5 w-3.5" />
                Reset
              </button>
            }
          >
            <div className="py-2">
              <WealthProfileGrid>
                <WealthTextField
                  label="Client name"
                  value={name}
                  onChange={setName}
                  error={clientNameError}
                  autoComplete="name"
                />
                <WealthAgeField
                  value={age}
                  onChange={setAge}
                  error={clientAgeError}
                />
                <WealthTextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  error={clientEmailError}
                  placeholder="client@email.com"
                  autoComplete="email"
                />
                <WealthTextField
                  label="Phone"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  error={clientPhoneError}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
                <WealthMoneyField
                  label="Goal amount"
                  value={goalAmount}
                  onChange={setGoalAmount}
                  error={goalError}
                  max={GOAL_AMOUNT_MAX}
                  slider={{
                    min: GOAL_AMOUNT_MIN,
                    max: GOAL_AMOUNT_MAX,
                    step: 1_00_000,
                    scale: "log",
                    presets: WEALTH_GOAL_PRESETS_DEFAULT,
                  }}
                />
                {mode !== "compounding" ? (
                  <div className="min-w-0">
                    <div className="mb-1.5 text-sm text-slate-600">Goal basis</div>
                    <WealthSegmented
                      fullWidth
                      layoutId="goals-basis-pill"
                      value={useInflAdj ? "infl" : "raw"}
                      onChange={(id) => setUseInflAdj(id === "infl")}
                      options={[
                        { id: "raw", label: "Stated" },
                        { id: "infl", label: "Inflation adj." },
                      ]}
                    />
                  </div>
                ) : null}
                <WealthYearField
                  label="Investment tenure"
                  value={tenureYears}
                  onChange={setTenureYears}
                  min={1}
                  max={50}
                  error={tenureError}
                  hint="Max 50 years"
                  slider={{
                    min: 1,
                    max: YEARS_SLIDER_MAX,
                    step: 1,
                    presets: WEALTH_YEAR_PRESETS_DEFAULT,
                  }}
                />
                {mode !== "compounding" ? (
                  <WealthPercentField
                    label="Annual step-up"
                    value={stepUpPct}
                    onChange={setStepUpPct}
                    error={stepUpError}
                    hint="Applied to Step-Up SIP each year"
                  />
                ) : null}
                {(mode === "current" || mode === "ls-sip") && (
                  <WealthMoneyField
                    label="Current corpus"
                    value={currentCorpus}
                    onChange={setCurrentCorpus}
                    error={corpusError}
                    max={CORPUS_AMOUNT_MAX}
                    slider={{
                      min: CORPUS_AMOUNT_MIN,
                      max: CORPUS_AMOUNT_MAX,
                      step: 1_00_000,
                      scale: "log",
                      presets: WEALTH_MONEY_PRESETS_DEFAULT,
                    }}
                  />
                )}
                {(mode === "current" || mode === "existing") && (
                  <WealthMoneyField
                    label="Current SIP"
                    value={currentMonthlySip}
                    onChange={setCurrentMonthlySip}
                    error={currentSipError}
                    max={SIP_AMOUNT_MAX}
                    slider={{
                      min: SIP_AMOUNT_MIN,
                      max: SIP_AMOUNT_MAX,
                      step: 1_000,
                      scale: "log",
                      presets: SIP_AMOUNT_PRESETS,
                    }}
                  />
                )}
                {mode === "ls-sip" && (
                  <WealthMoneyField
                    label="Extra lumpsum"
                    value={extraLumpsum}
                    onChange={setExtraLumpsum}
                    error={extraLsError}
                  />
                )}
                {mode === "periodic" && (
                  <>
                    <WealthMoneyField
                      label="Periodic amount"
                      value={periodicAmount}
                      onChange={setPeriodicAmount}
                      error={periodicAmountError}
                      max={CORPUS_AMOUNT_MAX}
                      slider={{
                        min: CORPUS_AMOUNT_MIN,
                        max: CORPUS_AMOUNT_MAX,
                        step: 1_00_000,
                        scale: "log",
                        presets: WEALTH_MONEY_PRESETS_DEFAULT,
                      }}
                    />
                    <div className="min-w-0">
                      <WealthSelectField
                        label="How often"
                        value={String(timesPerYear)}
                        onChange={(value) => setTimesPerYear(Number(value))}
                        options={FREQUENCY_OPTIONS}
                        hint={`${formatINRCurrency(periodicAmount * timesPerYear)} / year`}
                      />
                    </div>
                  </>
                )}
                {mode === "compounding" && (
                  <>
                    <div className="min-w-0">
                      <div className="mb-1.5 text-sm text-slate-600">
                        Investment for growth steps
                      </div>
                      <WealthSegmented
                        fullWidth
                        layoutId="goals-compounding-type"
                        value={investmentType}
                        onChange={(id) =>
                          setInvestmentType(id === "sip" ? "sip" : "one-time")
                        }
                        options={[
                          { id: "one-time", label: "One Time" },
                          { id: "sip", label: "SIP" },
                        ]}
                      />
                    </div>
                    <div className="min-w-0">
                      <WealthSelectField
                        label="Growth step size"
                        value={String(stepSize)}
                        onChange={(value) => setStepSize(Number(value))}
                        options={COMPOUNDING_STEP_OPTIONS}
                        hint="10K, 1L, 10L, or 1Cr milestones"
                      />
                    </div>
                  </>
                )}
                <WealthPercentField
                  label="Expected CAGR"
                  value={returnPct}
                  onChange={setReturnPct}
                  error={returnError}
                />
                <WealthPercentField
                  label="Inflation"
                  value={inflationPct}
                  onChange={setInflationPct}
                  error={inflationError}
                />
                <WealthPercentField
                  label="Tax / LTCG"
                  value={taxPct}
                  onChange={setTaxPct}
                  error={taxError}
                />
                <div className="min-w-0">
                  <div className="mb-1.5 text-sm text-slate-600">Real return</div>
                  <div className="flex h-[42px] items-center justify-between rounded-lg bg-slate-50 px-3 ring-1 ring-slate-200">
                    <span className="text-xs text-slate-500">After inflation</span>
                    <span className="text-sm font-medium tabular-nums text-emerald-700">
                      {formatPercent(realReturnPct)}
                    </span>
                  </div>
                </div>
              </WealthProfileGrid>
            </div>
          </WealthSection>
        </div>
      }
      results={
        <>
          {error ? <WealthStatusNote tone="error">{error}</WealthStatusNote> : null}
          {!canCalculate ? (
            <WealthStatusNote tone="error">
              <div className="flex flex-col gap-1">
                <span className="font-semibold">
                  Fix the inputs above to refresh the calculation
                  {result ? ". Showing the last valid result." : "."}
                </span>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] font-normal">
                  {fieldErrors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            </WealthStatusNote>
          ) : null}
          {loading && !result && canCalculate ? (
            <WealthStatusNote tone="info">Calculating…</WealthStatusNote>
          ) : null}
          {result ? (
            <GoalResults
              mode={mode}
              result={result}
              tenureYears={tenureYears}
              currentMonthlySip={currentMonthlySip}
              openMilestones={openMilestones}
              onToggleMilestones={() => setOpenMilestones((v) => !v)}
              openAnalytics={openAnalytics}
              onToggleAnalytics={() => setOpenAnalytics((v) => !v)}
              openSchedule={openSchedule}
              onToggleSchedule={() => setOpenSchedule((v) => !v)}
              openDelay={openDelay}
              onToggleDelay={() => setOpenDelay((v) => !v)}
              chartTab={chartTab}
              onChartTabChange={setChartTab}
            />
          ) : null}
        </>
      }
      footer={
        <WealthDisclaimer
          notes={[
            "Delay permanently compresses the compounding runway under the same return path.",
            "Headline target is not purchasing power. Frame conversations on the inflation-adjusted corpus.",
            "Tax is applied on gains only. Net after tax is the amount available at the goal date.",
            "Projections are illustrative. Actual market returns and tax rules can differ.",
          ]}
        >
          Figures are for illustration only. Goal funding paths use the stated return, inflation,
          and tax assumptions. Markets carry risk; past performance does not guarantee future
          results.
        </WealthDisclaimer>
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
          email,
          phone,
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
          email,
          phone,
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
          email,
          phone,
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
          email,
          phone,
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
          email,
          phone,
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


function toneFromSchedule(tone?: string): "default" | "emerald" | "amber" | "rose" {
  if (tone === "step") return "emerald";
  if (tone === "warn") return "amber";
  return "default";
}

function GoalScheduleTable({
  mode,
  rows,
  filterPlaceholder = "Filter by year…",
}: {
  mode: Mode;
  rows: Array<Record<string, number>>;
  filterPlaceholder?: string;
}) {
  const cols = scheduleColumns(mode);
  const columns: WealthTableColumn<Record<string, number>>[] = cols.map((c) => ({
    key: c.key,
    header: c.header,
    align: c.align,
    sticky: c.sticky,
    tone: toneFromSchedule(c.tone),
    searchValue: (row) => String(row[c.key] ?? ""),
    render: (row) =>
      c.format === "inr" ? moneyCell(row[c.key] ?? 0) : String(row[c.key] ?? ""),
  }));
  return (
    <WealthDataTable
      rows={rows}
      columns={columns}
      getRowKey={(row, i) => row.year ?? i}
      filterPlaceholder={filterPlaceholder}
    />
  );
}

function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{children}</div>;
}

function GoalSummaryCard({
  target,
  inflAdj,
  tenureYears,
  standardSip,
  stepUpSip,
}: {
  target: number;
  inflAdj: number;
  tenureYears: number;
  standardSip?: number;
  stepUpSip?: number;
}) {
  const sameBasis = Math.abs(target - inflAdj) < 0.5;
  const sipDelta =
    standardSip != null && stepUpSip != null
      ? Math.max(0, standardSip - stepUpSip)
      : null;

  const rows: Array<{
    label: string;
    value: string;
    tone?: "neutral" | "emerald" | "net";
  }> = [];

  if (!sameBasis) {
    rows.push({
      label: "Inflation-adjusted",
      value: formatINRCurrency(inflAdj),
      tone: "neutral",
    });
  }
  rows.push({
    label: "Horizon",
    value: `${tenureYears} year${tenureYears === 1 ? "" : "s"}`,
    tone: "neutral",
  });
  if (sipDelta != null && sipDelta > 0) {
    rows.push({
      label: "Step-up starts lower",
      value: `${formatINRCurrency(sipDelta)} / mo`,
      tone: "emerald",
    });
  }
  rows.push({
    label: "Both paths reach",
    value: formatINRCurrency(target),
    tone: "net",
  });

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_8px_24px_rgba(15,23,42,0.04)] sm:px-5">
      <div className="flex items-center gap-2.5">
        <WealthIconMark className="h-7 w-7">
          <IconTarget className="h-3.5 w-3.5" />
        </WealthIconMark>
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
          Goal summary
        </div>
      </div>

      <div className="mt-3">
        <div className="text-[13px] text-slate-500">Target goal</div>
        <div className="mt-0.5 text-[24px] font-medium tracking-tight tabular-nums text-slate-900">
          {formatINRCurrency(target)}
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {sameBasis
            ? "Net after capital gains tax · stated goal basis"
            : "Net after capital gains tax"}
        </p>
      </div>

      <dl className="mt-auto space-y-0 border-t border-slate-100 pt-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className={
              row.tone === "net"
                ? "mt-1 flex items-baseline justify-between gap-4 rounded-xl bg-emerald-50/70 px-3 py-2.5"
                : "flex items-baseline justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0"
            }
          >
            <dt
              className={
                row.tone === "net"
                  ? "text-[14px] font-medium text-emerald-800/80"
                  : "text-[14px] text-slate-500"
              }
            >
              {row.label}
            </dt>
            <dd
              className={
                row.tone === "net"
                  ? "text-[14px] font-semibold tabular-nums tracking-tight text-emerald-800"
                  : row.tone === "emerald"
                    ? "text-[14px] font-medium tabular-nums tracking-tight text-emerald-700"
                    : "text-[14px] font-medium tabular-nums tracking-tight text-slate-900"
              }
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}


const MODE_AUDIT_HINT: Record<Mode, string> = {
  sip: "Flat vs step-up SIP paths",
  current: "Current corpus + additional paths",
  "ls-sip": "All-LS, all-SIP, and mix options",
  existing: "Keep existing SIP + top-up",
  periodic: "Periodic lumpsum + remaining SIP",
  compounding: "SIP vs lumpsum growth steps",
};

function GoalAuditBlock({
  mode,
  result,
  tenureYears,
  children,
}: {
  mode: Mode;
  result: GoalPlannerResult;
  tenureYears: number;
  children: ReactNode;
}) {
  const target = result.targetGoal;
  const shortfall = result.shortfall ?? 0;
  const primaryInvested =
    result.standard?.invested ??
    result.existing?.totalInvested ??
    result.periodic?.totalInvested ??
    0;
  const tax = result.standard?.tax ?? result.periodic?.tax ?? 0;
  const gain = result.standard?.gain ?? result.periodic?.gain ?? 0;
  const surplusCredit = Math.max(
    0,
    (result.existing?.netCredit ?? result.periodic?.netCredit ?? 0) - target,
  );

  const rows: WealthAuditRow[] = [
    {
      label: "Target goal (net)",
      cells: [{ text: formatINRCurrency(target), tone: "emerald" }],
      highlight: true,
    },
    {
      label: "Inflation-adjusted goal",
      cells: [{ text: formatINRCurrency(result.inflAdjGoal) }],
    },
  ];

  if (result.shortfall != null) {
    rows.push({
      label: "Shortfall",
      cells: [{ text: formatINRCurrency(result.shortfall), tone: "rose" }],
    });
  }
  if (result.existingCredit != null || result.existing?.netCredit != null) {
    rows.push({
      label: "Existing credit",
      cells: [
        {
          text: formatINRCurrency(
            result.existingCredit ?? result.existing?.netCredit ?? 0,
          ),
        },
      ],
    });
  }
  if (result.standard) {
    rows.push(
      {
        label: mode === "sip" ? "Standard SIP (monthly)" : "Additional SIP (monthly)",
        cells: [{ text: formatINRCurrency(result.standard.monthlySip), tone: "emerald" }],
      },
      {
        label: "SIP invested",
        cells: [{ text: formatINRCurrency(result.standard.invested) }],
      },
      {
        label: "SIP maturity",
        cells: [{ text: formatINRCurrency(result.standard.maturity) }],
      },
      {
        label: "SIP tax",
        cells: [{ text: formatINRCurrency(result.standard.tax), tone: "rose" }],
        tax: true,
      },
      {
        label: "SIP net after tax",
        cells: [{ text: formatINRCurrency(result.standard.netAfterTax), tone: "emerald" }],
        highlight: true,
      },
    );
  }
  if (result.stepUp) {
    rows.push({
      label: "Step-up SIP (start)",
      cells: [{ text: formatINRCurrency(result.stepUp.monthlySip), tone: "emerald" }],
    });
    if (result.stepUp.endMonthlySip != null) {
      rows.push({
        label: "Step-up SIP (end)",
        cells: [{ text: formatINRCurrency(result.stepUp.endMonthlySip) }],
      });
    }
  }
  if (result.lumpsum?.lumpsum != null) {
    rows.push({
      label: mode === "compounding" ? "Lumpsum today" : "Additional lumpsum today",
      cells: [{ text: formatINRCurrency(result.lumpsum.lumpsum) }],
    });
  }
  if (result.allLumpsum != null) {
    rows.push({
      label: "All lumpsum today",
      cells: [{ text: formatINRCurrency(result.allLumpsum) }],
    });
  }
  if (result.allSip != null) {
    rows.push({
      label: "All SIP monthly",
      cells: [{ text: formatINRCurrency(result.allSip) }],
    });
  }
  if (result.mixSip != null) {
    rows.push({
      label: "Mix remaining SIP",
      cells: [{ text: formatINRCurrency(result.mixSip), tone: "emerald" }],
      highlight: true,
    });
  }

  return (
    <div className="space-y-5">
      <WealthAuditLedger
        stats={[
          {
            label: "Horizon",
            value: `${tenureYears} yr${tenureYears === 1 ? "" : "s"}`,
            hint: MODE_AUDIT_HINT[mode],
          },
          {
            label: "Target (net)",
            value: formatINRCurrency(target),
            hint:
              result.inflAdjGoal !== target
                ? `Infl-adj. ${formatINRCurrency(result.inflAdjGoal)}`
                : "Net after capital gains tax",
            tone: "emerald",
          },
          {
            label: result.overfunded ? "Surplus credit" : "Shortfall",
            value: formatINRCurrency(result.overfunded ? surplusCredit : shortfall),
            hint: result.overfunded ? "Already covers the goal" : "Still needing funding",
          },
        ]}
        chips={
          <>
            <WealthAuditChip label="Tax on gains" tone="rose">
              {gain > 0
                ? `${formatPercent((tax / gain) * 100, 1)} of pre-tax gain (${formatINRCurrency(tax)})`
                : formatINRCurrency(tax)}
            </WealthAuditChip>
            <WealthAuditChip label="Primary path invested" tone="emerald">
              {formatINRCurrency(primaryInvested)}
            </WealthAuditChip>
          </>
        }
        tableTitle={
          mode === "sip"
            ? "SIP vs Step-up breakdown"
            : mode === "current"
              ? "Current investment breakdown"
              : "Outcome breakdown"
        }
        tableSubtitle="Line-by-line metrics for the active funding paths"
        columns={["Metric", "Amount"]}
        rows={rows}
      />
      {children}
    </div>
  );
}

function GoalResultSections({
  milestones,
  analytics,
  audit,
  delay,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
  openDelay,
  onToggleDelay,
  tenureYears,
  milestonesSubtitle,
  analyticsSubtitle,
  auditTitle,
}: {
  milestones: ReactNode;
  analytics: ReactNode;
  audit?: ReactNode;
  delay?: ReactNode;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule?: boolean;
  onToggleSchedule?: () => void;
  openDelay?: boolean;
  onToggleDelay?: () => void;
  tenureYears: number;
  milestonesSubtitle?: string;
  analyticsSubtitle?: string;
  auditTitle?: string;
}) {
  return (
    <div className="space-y-5">
      <WealthSection
        badge="02 · Milestones"
        title="Goal Milestones"
        subtitle={
          milestonesSubtitle ??
          `Key funding outcomes · ${tenureYears} year horizon`
        }
        open={openMilestones}
        onToggle={onToggleMilestones}
        mark={
          <WealthIconMark tone="emerald">
            <IconTarget />
          </WealthIconMark>
        }
        actions={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            Horizon: {tenureYears} Year{tenureYears === 1 ? "" : "s"}
          </span>
        }
      >
        {milestones}
      </WealthSection>

      <WealthSection
        badge="03 · Analytics"
        title="Goal Analytics"
        subtitle={analyticsSubtitle ?? "Charts and funding mix for the selected mode"}
        open={openAnalytics}
        onToggle={onToggleAnalytics}
        mark={
          <WealthIconMark>
            <IconChart />
          </WealthIconMark>
        }
      >
        {analytics}
      </WealthSection>

      {delay && openDelay != null && onToggleDelay ? (
        <WealthSection
          badge="04 · Delay"
          title="Cost of Delay"
          subtitle="How waiting 3 to 12 months raises the SIP required"
          open={openDelay}
          onToggle={onToggleDelay}
          mark={
            <WealthIconMark tone="amber">
              <IconDelay />
            </WealthIconMark>
          }
        >
          {delay}
        </WealthSection>
      ) : null}

      {audit && openSchedule != null && onToggleSchedule ? (
        <WealthSection
          badge={delay ? "05 · Audit" : "04 · Audit"}
          title={auditTitle ?? "Goal Outcome Ledger"}
          subtitle="Horizon, shortfall, tax drag, and year-by-year funding audit"
          open={openSchedule}
          onToggle={onToggleSchedule}
          mark={
            <WealthIconMark>
              <IconCalendar />
            </WealthIconMark>
          }
        >
          {audit}
        </WealthSection>
      ) : null}
    </div>
  );
}

function GoalResults({
  mode,
  result,
  tenureYears,
  currentMonthlySip,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
  openDelay,
  onToggleDelay,
  chartTab,
  onChartTabChange,
}: {
  mode: Mode;
  result: GoalPlannerResult;
  tenureYears: number;
  currentMonthlySip: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
  openDelay: boolean;
  onToggleDelay: () => void;
  chartTab: "funding" | "compare";
  onChartTabChange: (tab: "funding" | "compare") => void;
}) {
  const sectionProps = {
    openMilestones,
    onToggleMilestones,
    openAnalytics,
    onToggleAnalytics,
    openSchedule,
    onToggleSchedule,
    openDelay,
    onToggleDelay,
    tenureYears,
  };
  const chartProps = { chartTab, onChartTabChange };

  if (mode === "ls-sip") {
    return <LsSipResults result={result} {...sectionProps} {...chartProps} />;
  }
  if (mode === "current") {
    return <CurrentInvestmentResults result={result} {...sectionProps} {...chartProps} />;
  }
  if (mode === "existing") {
    return (
      <ExistingSipResults
        result={result}
        currentMonthlySip={currentMonthlySip}
        {...sectionProps}
        {...chartProps}
      />
    );
  }
  if (mode === "periodic") {
    return <PeriodicResults result={result} {...sectionProps} {...chartProps} />;
  }
  if (mode === "compounding" && result.standard && result.lumpsum?.lumpsum != null) {
    return (
      <GoalResultSections
        {...sectionProps}
        milestones={
          <MetricGrid>
            <WealthMetricCard
              title="Monthly SIP"
              value={result.standard.monthlySip}
              description="Every month for the full tenure"
              tone="positive"
              badge="SIP"
              footer={
                <>
                  Net ·{" "}
                  <span className="font-semibold tabular-nums text-emerald-700">
                    {formatINRCurrency(result.standard.netAfterTax)}
                  </span>
                </>
              }
              mark={
                <WealthIconMark tone="emerald" className="h-7 w-7">
                  <IconSip className="h-3.5 w-3.5" />
                </WealthIconMark>
              }
            />
            <WealthMetricCard
              title="Lumpsum Today"
              value={result.lumpsum.lumpsum ?? 0}
              description="One-time amount today"
              tone="neutral"
              badge="One Time"
              footer={
                <>
                  Net ·{" "}
                  <span className="font-semibold tabular-nums text-emerald-700">
                    {formatINRCurrency(result.lumpsum.netAfterTax)}
                  </span>
                </>
              }
              mark={
                <WealthIconMark className="h-7 w-7">
                  <IconStepUp className="h-3.5 w-3.5" />
                </WealthIconMark>
              }
            />
            <WealthMetricCard
              title="Target Goal"
              value={result.targetGoal}
              description="Net after capital gains tax"
              tone="accent"
              footer={
                result.stepSize != null ? (
                  <>
                    Step size ·{" "}
                    <span className="font-semibold tabular-nums text-slate-700">
                      {formatINRCurrency(result.stepSize)}
                    </span>
                  </>
                ) : undefined
              }
              mark={
                <WealthIconMark className="h-7 w-7">
                  <IconTarget className="h-3.5 w-3.5" />
                </WealthIconMark>
              }
            />
          </MetricGrid>
        }
        analytics={
          <CompoundingAnalytics
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
        }
        analyticsSubtitle="SIP vs lumpsum growth, mix, and funding paths"
        milestonesSubtitle="Required SIP, lumpsum today, and target corpus"
        auditTitle="Growth Steps Ledger"
        audit={
          <GoalAuditBlock mode="compounding" result={result} tenureYears={tenureYears}>
            <CompoundingSchedule
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
          </GoalAuditBlock>
        }
      />
    );
  }

  const delays = (result.delays ?? []).map((d) => ({
    mo: d.months,
    sip: d.sipRequired,
    extra: d.extraInvested,
  }));

  return (
    <GoalResultSections
      {...sectionProps}
      milestones={<GoalHero mode={mode} result={result} />}
      milestonesSubtitle="Flat SIP, step-up SIP, and target corpus"
      analyticsSubtitle="Funding mix and SIP vs step-up comparison"
      auditTitle="SIP vs Step-up Ledger"
      analytics={
        <div className="space-y-5">
          <div className="min-w-0 overflow-hidden">
            {renderGoalCharts(mode, result, tenureYears, chartTab, onChartTabChange)}
          </div>
          <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3">
            <GoalSummaryCard
              target={result.targetGoal}
              inflAdj={result.inflAdjGoal}
              tenureYears={tenureYears}
              standardSip={result.standard?.monthlySip}
              stepUpSip={result.stepUp?.monthlySip}
            />
            {result.standard ? (
              <LegMetricCard
                title={mode === "sip" ? "Standard SIP" : "Additional SIP"}
                leg={result.standard}
              />
            ) : null}
            {result.stepUp ? (
              <LegMetricCard
                title={mode === "sip" ? "Step-up SIP" : "Additional step-up SIP"}
                leg={result.stepUp}
              />
            ) : null}
            {result.lumpsum?.lumpsum != null ? (
              <LegMetricCard title="Additional lumpsum today" leg={result.lumpsum} />
            ) : null}
          </div>
        </div>
      }
      delay={
        delays.length > 0 ? (
          <DelayCostCards
            delays={delays}
            baselineSip={result.standard?.monthlySip ?? 0}
          />
        ) : undefined
      }
      audit={
        <GoalAuditBlock mode={mode} result={result} tenureYears={tenureYears}>
          <GoalScheduleTable mode={mode} rows={result.schedule} />
        </GoalAuditBlock>
      }
    />
  );
}

function sectionSpread(props: {
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
  openDelay: boolean;
  onToggleDelay: () => void;
  tenureYears: number;
}) {
  return props;
}

function LsSipResults({
  result,
  tenureYears,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
  openDelay,
  onToggleDelay,
  chartTab: _chartTab,
  onChartTabChange: _onChartTabChange,
}: {
  result: GoalPlannerResult;
  tenureYears: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
  openDelay: boolean;
  onToggleDelay: () => void;
  chartTab: "funding" | "compare";
  onChartTabChange: (tab: "funding" | "compare") => void;
}) {
  const [localTab, setLocalTab] = useState<"funding" | "compare">("funding");
  void _chartTab;
  void _onChartTabChange;

  const years = result.schedule.length || tenureYears;
  const mixSip = result.mixSip ?? 0;
  const allSip = result.allSip ?? 0;
  const allLumpsum = result.allLumpsum ?? 0;
  const standard = result.standard;
  const stepUp = result.stepUp;
  const shortfall = result.shortfall ?? 0;

  const fundingChart = goalRequiredChart("ls-sip", result);
  const compareChart = goalExtraChart("ls-sip", result, years);
  const activeChart = localTab === "compare" ? compareChart : fundingChart;

  return (
    <GoalResultSections
      {...sectionSpread({
        openMilestones,
        onToggleMilestones,
        openAnalytics,
        onToggleAnalytics,
        openSchedule,
        onToggleSchedule,
        openDelay,
        onToggleDelay,
        tenureYears,
      })}
      milestones={
        <MetricGrid>
          <WealthMetricCard
            title="Shortfall"
            value={shortfall}
            description="Amount still needing funding after current credit"
            badge="Gap"
            tone="neutral"
            footer={
              <>
                Current credit ·{" "}
                <span className="font-semibold tabular-nums text-slate-700">
                  {formatINRCurrency(result.existingCredit ?? 0)}
                </span>
              </>
            }
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconTarget className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Mix Monthly SIP"
            value={mixSip}
            description="Remaining SIP with extra lumpsum applied"
            badge="Mix"
            tone="positive"
            footer={
              <>
                All SIP ·{" "}
                <span className="font-semibold tabular-nums text-slate-700">
                  {formatINRCurrency(allSip)}
                </span>
                /mo
              </>
            }
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconSip className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="All Lumpsum"
            value={allLumpsum}
            description="Fund the goal with one lumpsum today"
            badge="One Time"
            tone="positive"
            footer={
              result.extraLumpsum != null ? (
                <>
                  Extra lumpsum in mix ·{" "}
                  <span className="font-semibold tabular-nums text-slate-700">
                    {formatINRCurrency(result.extraLumpsum)}
                  </span>
                </>
              ) : undefined
            }
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconStepUp className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
        </MetricGrid>
      }
      analytics={
        <div className="space-y-5">
          <WealthAnalyticsChrome
            tabs={
              <WealthSegmented
                variant="underline"
                layoutId="ls-sip-chart-tabs"
                value={localTab}
                onChange={setLocalTab}
                options={[
                  {
                    id: "funding",
                    label: "Funding",
                    icon: <IconDonut className="h-3.5 w-3.5" />,
                  },
                  {
                    id: "compare",
                    label: "Comparison",
                    icon: <IconChart className="h-3.5 w-3.5" />,
                  },
                ]}
              />
            }
          >
            <div className="min-w-0 overflow-hidden">{activeChart}</div>
          </WealthAnalyticsChrome>

          <div className="space-y-5">
            <ModeSummaryTable
              title="Goal summary"
              subtitle="All-LS, all-SIP, and mix remaining SIP against the target"
              rows={[
                {
                  label: "Shortfall to fund",
                  value: formatINRCurrency(shortfall),
                  tone: "rose",
                  highlight: true,
                },
                {
                  label: "Target goal (net)",
                  value: formatINRCurrency(result.targetGoal),
                  tone: "emerald",
                },
                {
                  label: "Credit from current corpus",
                  value: formatINRCurrency(result.existingCredit ?? 0),
                  tone: "emerald",
                },
                {
                  label: "All lumpsum (today)",
                  value: formatINRCurrency(allLumpsum),
                },
                {
                  label: "All SIP (monthly)",
                  value: formatINRCurrency(allSip),
                },
                {
                  label: "Mix remaining SIP",
                  value: formatINRCurrency(mixSip),
                  tone: "emerald",
                },
                {
                  label: "Horizon",
                  value: `${tenureYears} year${tenureYears === 1 ? "" : "s"}`,
                },
              ]}
            />

            <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
              {standard ? <LegMetricCard title="Additional SIP" leg={standard} /> : null}
              {stepUp ? <LegMetricCard title="Additional step-up SIP" leg={stepUp} /> : null}
            </div>
          </div>
        </div>
      }
      audit={
        <GoalAuditBlock mode="ls-sip" result={result} tenureYears={tenureYears}>
          <GoalScheduleTable mode="ls-sip" rows={result.schedule} />
        </GoalAuditBlock>
      }
      milestonesSubtitle="Shortfall, mix SIP, and all-lumpsum path"
      analyticsSubtitle="Corpus mix and all-LS vs all-SIP vs mix"
      auditTitle="LS + SIP Options Ledger"
    />
  );
}

function PeriodicResults({
  result,
  tenureYears,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
  openDelay,
  onToggleDelay,
  chartTab: _chartTab,
  onChartTabChange: _onChartTabChange,
}: {
  result: GoalPlannerResult;
  tenureYears: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
  openDelay: boolean;
  onToggleDelay: () => void;
  chartTab: "funding" | "compare";
  onChartTabChange: (tab: "funding" | "compare") => void;
}) {
  const [localTab, setLocalTab] = useState<"funding" | "compare" | "mix">("funding");
  void _chartTab;
  void _onChartTabChange;

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

  const fundingChart = goalRequiredChart("periodic", result);
  const compareChart = goalExtraChart("periodic", result, years);
  const mixChart = periodic ? (
    <WealthMixDonut
      title="Periodic mix"
      centerLabel="Maturity"
      centerValue={periodic.maturity}
      tax={periodicTax}
      net={periodic.netCredit}
      netLabel="Net credit"
      slices={[
        {
          name: "Periodic invested",
          value: periodic.totalInvested,
          color: wealthMixColors.invested,
        },
        {
          name: "Periodic gain",
          value: periodicGain,
          color: wealthMixColors.gain,
        },
      ]}
    />
  ) : null;

  const activeChart =
    localTab === "compare"
      ? compareChart
      : localTab === "mix"
        ? mixChart
        : fundingChart;

  return (
    <GoalResultSections
      {...sectionSpread({
        openMilestones,
        onToggleMilestones,
        openAnalytics,
        onToggleAnalytics,
        openSchedule,
        onToggleSchedule,
        openDelay,
        onToggleDelay,
        tenureYears,
      })}
      milestones={
        <div className="space-y-4">
          {result.overfunded ? (
            <WealthStatusNote tone="info">
              Periodic investments already fund this goal. Additional SIP, step-up, and lumpsum are not
              required.
            </WealthStatusNote>
          ) : null}
          <MetricGrid>
            <WealthMetricCard
              title={result.overfunded ? "Periodic Net Credit" : "Shortfall"}
              value={result.overfunded ? (periodic?.netCredit ?? 0) : shortfall}
              description={
                result.overfunded
                  ? "Credit already covering the goal"
                  : "Amount still needing funding after periodic credit"
              }
              badge={result.overfunded ? "Covered" : "Gap"}
              tone="neutral"
              footer={
                <>
                  Periodic credit ·{" "}
                  <span className="font-semibold tabular-nums text-slate-700">
                    {formatINRCurrency(periodic?.netCredit ?? 0)}
                  </span>
                </>
              }
              mark={
                <WealthIconMark className="h-7 w-7">
                  <IconTarget className="h-3.5 w-3.5" />
                </WealthIconMark>
              }
            />
            <WealthMetricCard
              title="Additional SIP"
              value={standard?.monthlySip ?? 0}
              description="Flat monthly SIP to close the shortfall"
              badge="Flat"
              tone="positive"
              footer={
                standard ? (
                  <>
                    Invested ·{" "}
                    <span className="font-semibold tabular-nums text-slate-700">
                      {formatINRCurrency(standard.invested)}
                    </span>
                    {" · Net "}
                    <span className="font-semibold tabular-nums text-emerald-700">
                      {formatINRCurrency(standard.netAfterTax)}
                    </span>
                  </>
                ) : undefined
              }
              mark={
                <WealthIconMark tone="emerald" className="h-7 w-7">
                  <IconSip className="h-3.5 w-3.5" />
                </WealthIconMark>
              }
            />
            <WealthMetricCard
              title="Step-up SIP"
              value={stepUp?.monthlySip ?? 0}
              description="Starting monthly SIP with annual step-up"
              badge="Step-up"
              tone="positive"
              footer={
                stepUp?.endMonthlySip != null ? (
                  <>
                    Ends at ·{" "}
                    <span className="font-semibold tabular-nums text-emerald-700">
                      {formatINRCurrency(stepUp.endMonthlySip)}
                    </span>
                    /mo
                  </>
                ) : lumpsum?.lumpsum != null ? (
                  <>
                    Or lumpsum today ·{" "}
                    <span className="font-semibold tabular-nums text-slate-700">
                      {formatINRCurrency(lumpsum.lumpsum)}
                    </span>
                  </>
                ) : undefined
              }
              mark={
                <WealthIconMark tone="emerald" className="h-7 w-7">
                  <IconStepUp className="h-3.5 w-3.5" />
                </WealthIconMark>
              }
            />
          </MetricGrid>
        </div>
      }
      analytics={
        <div className="space-y-5">
          <WealthAnalyticsChrome
            tabs={
              <WealthSegmented
                variant="underline"
                layoutId="periodic-chart-tabs"
                value={localTab}
                onChange={setLocalTab}
                options={[
                  {
                    id: "funding",
                    label: "Funding",
                    icon: <IconChart className="h-3.5 w-3.5" />,
                  },
                  {
                    id: "compare",
                    label: "Comparison",
                    icon: <IconRates className="h-3.5 w-3.5" />,
                  },
                  {
                    id: "mix",
                    label: "Periodic Mix",
                    icon: <IconDonut className="h-3.5 w-3.5" />,
                  },
                ]}
              />
            }
          >
            <div className="min-w-0 overflow-hidden">{activeChart}</div>
          </WealthAnalyticsChrome>

          <div className="space-y-5">
            <ModeSummaryTable
              title="Goal summary"
              subtitle="Periodic credit, shortfall, and the remaining funding paths"
              rows={[
                {
                  label: "Shortfall to fund",
                  value: formatINRCurrency(shortfall),
                  tone: "rose",
                  highlight: true,
                },
                {
                  label: "Target goal (net)",
                  value: formatINRCurrency(result.targetGoal),
                  tone: "emerald",
                },
                {
                  label: "Periodic net credit",
                  value: formatINRCurrency(periodic?.netCredit ?? 0),
                  tone: "emerald",
                },
                {
                  label: "Periodic maturity",
                  value: formatINRCurrency(periodic?.maturity ?? 0),
                },
                {
                  label: "Periodic invested",
                  value: formatINRCurrency(periodic?.totalInvested ?? 0),
                },
                {
                  label: "Periodic payments",
                  value: String(periodic?.payments ?? 0),
                },
                {
                  label: "Horizon",
                  value: `${tenureYears} year${tenureYears === 1 ? "" : "s"}`,
                },
              ]}
            />

            <FundingPathsBoard
              muted={Boolean(result.overfunded)}
              lumpsum={lumpsum}
              standard={standard}
              stepUp={stepUp}
            />
          </div>
        </div>
      }
      audit={
        <GoalAuditBlock mode="periodic" result={result} tenureYears={tenureYears}>
          <GoalScheduleTable mode="periodic" rows={result.schedule} />
        </GoalAuditBlock>
      }
      milestonesSubtitle="Periodic credit, shortfall, and remaining SIP paths"
      analyticsSubtitle="Periodic mix, waterfall, and remaining funding options"
      auditTitle="Periodic Lumpsum Ledger"
    />
  );
}

function CurrentInvestmentResults({
  result,
  tenureYears,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
  openDelay,
  onToggleDelay,
  chartTab: _chartTab,
  onChartTabChange: _onChartTabChange,
}: {
  result: GoalPlannerResult;
  tenureYears: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
  openDelay: boolean;
  onToggleDelay: () => void;
  chartTab: "funding" | "compare";
  onChartTabChange: (tab: "funding" | "compare") => void;
}) {
  const [localTab, setLocalTab] = useState<"funding" | "compare" | "mix">("funding");
  void _chartTab;
  void _onChartTabChange;

  const years = result.schedule.length || tenureYears;
  const existing = result.existing;
  const standard = result.standard;
  const stepUp = result.stepUp;
  const lumpsum = result.lumpsum;
  const shortfall = result.shortfall ?? 0;

  const fundingChart = goalRequiredChart("current", result);
  const compareChart = goalExtraChart("current", result, years);
  const mixChart =
    standard != null ? (
      <WealthMixDonut
        title="Additional SIP mix"
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
    ) : null;

  const activeChart =
    localTab === "compare"
      ? compareChart
      : localTab === "mix"
        ? mixChart
        : fundingChart;

  return (
    <GoalResultSections
      {...sectionSpread({
        openMilestones,
        onToggleMilestones,
        openAnalytics,
        onToggleAnalytics,
        openSchedule,
        onToggleSchedule,
        openDelay,
        onToggleDelay,
        tenureYears,
      })}
      milestones={
        <MetricGrid>
          <WealthMetricCard
            title="Shortfall"
            value={shortfall}
            description="Amount still needing funding after existing credit"
            badge="Gap"
            tone="neutral"
            footer={
              <>
                Existing credit ·{" "}
                <span className="font-semibold tabular-nums text-slate-700">
                  {formatINRCurrency(existing?.netCredit ?? 0)}
                </span>
              </>
            }
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconTarget className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Additional SIP"
            value={standard?.monthlySip ?? 0}
            description="Flat monthly SIP to close the shortfall"
            badge="Flat"
            tone="positive"
            footer={
              standard ? (
                <>
                  Invested ·{" "}
                  <span className="font-semibold tabular-nums text-slate-700">
                    {formatINRCurrency(standard.invested)}
                  </span>
                  {" · Net "}
                  <span className="font-semibold tabular-nums text-emerald-700">
                    {formatINRCurrency(standard.netAfterTax)}
                  </span>
                </>
              ) : undefined
            }
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconSip className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Step-up SIP"
            value={stepUp?.monthlySip ?? 0}
            description="Starting monthly SIP with annual step-up"
            badge="Step-up"
            tone="positive"
            footer={
              stepUp?.endMonthlySip != null ? (
                <>
                  Ends at ·{" "}
                  <span className="font-semibold tabular-nums text-emerald-700">
                    {formatINRCurrency(stepUp.endMonthlySip)}
                  </span>
                  /mo
                </>
              ) : lumpsum?.lumpsum != null ? (
                <>
                  Or lumpsum today ·{" "}
                  <span className="font-semibold tabular-nums text-slate-700">
                    {formatINRCurrency(lumpsum.lumpsum)}
                  </span>
                </>
              ) : undefined
            }
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconStepUp className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
        </MetricGrid>
      }
      analytics={
        <div className="space-y-5">
          <WealthAnalyticsChrome
            tabs={
              <WealthSegmented
                variant="underline"
                layoutId="current-chart-tabs"
                value={localTab}
                onChange={setLocalTab}
                options={[
                  {
                    id: "funding",
                    label: "Funding",
                    icon: <IconChart className="h-3.5 w-3.5" />,
                  },
                  {
                    id: "compare",
                    label: "Comparison",
                    icon: <IconRates className="h-3.5 w-3.5" />,
                  },
                  {
                    id: "mix",
                    label: "SIP Mix",
                    icon: <IconDonut className="h-3.5 w-3.5" />,
                  },
                ]}
              />
            }
          >
            <div className="min-w-0 overflow-hidden">{activeChart}</div>
          </WealthAnalyticsChrome>

          <div className="space-y-5">
            <CurrentSummaryCard
              target={result.targetGoal}
              inflAdj={result.inflAdjGoal}
              shortfall={shortfall}
              existingCredit={existing?.netCredit ?? 0}
              corpusFv={existing?.corpusFv ?? 0}
              sipFv={existing?.sipFv ?? 0}
              tenureYears={tenureYears}
            />

            <FundingPathsBoard lumpsum={lumpsum} standard={standard} stepUp={stepUp} />
          </div>
        </div>
      }
      audit={
        <GoalAuditBlock mode="current" result={result} tenureYears={tenureYears}>
          <GoalScheduleTable mode="current" rows={result.schedule} />
        </GoalAuditBlock>
      }
      milestonesSubtitle="Shortfall and paths to close the funding gap"
      analyticsSubtitle="Waterfall, capital compare, and SIP mix"
      auditTitle="Current Investment Ledger"
    />
  );
}

function ModeSummaryTable({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Array<{
    label: string;
    value: string;
    tone?: "default" | "emerald" | "rose";
    highlight?: boolean;
  }>;
}) {
  return (
    <div className="space-y-2.5">
      <div>
        <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">
          {title}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <WealthLedgerShell className="min-w-[24rem]">
          <table className="w-full border-collapse text-left text-[13px] tabular-nums">
            <thead>
              <tr className={wealthLedgerTheadClass()}>
                <th className="px-4 py-3.5 text-left text-[13px] font-medium text-slate-600">
                  Metric
                </th>
                <th className="px-4 py-3.5 text-right text-[13px] font-medium text-emerald-700">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className={
                    row.highlight
                      ? "border-t border-emerald-200/80 bg-emerald-50/60"
                      : "transition-colors hover:bg-slate-50/80"
                  }
                >
                  <td className="px-4 py-3.5 text-[14px] text-slate-700">
                    {row.highlight ? (
                      <span className="inline-flex items-center rounded-md bg-emerald-600 px-2 py-0.5 text-[12px] font-semibold text-white">
                        {row.label}
                      </span>
                    ) : (
                      row.label
                    )}
                  </td>
                  <td
                    className={
                      row.tone === "rose"
                        ? "px-4 py-3.5 text-right text-[14px] font-semibold tabular-nums text-rose-600"
                        : row.tone === "emerald"
                          ? "px-4 py-3.5 text-right text-[14px] font-semibold tabular-nums text-emerald-700"
                          : "px-4 py-3.5 text-right text-[14px] font-medium tabular-nums text-slate-800"
                    }
                  >
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </WealthLedgerShell>
      </div>
    </div>
  );
}

function CurrentSummaryCard({
  target,
  inflAdj,
  shortfall,
  existingCredit,
  corpusFv,
  sipFv,
  tenureYears,
}: {
  target: number;
  inflAdj: number;
  shortfall: number;
  existingCredit: number;
  corpusFv: number;
  sipFv: number;
  tenureYears: number;
}) {
  const sameBasis = Math.abs(target - inflAdj) < 0.5;
  const rows: Array<{
    label: string;
    value: string;
    tone?: "default" | "emerald" | "rose";
    highlight?: boolean;
  }> = [
    {
      label: "Shortfall to fund",
      value: formatINRCurrency(shortfall),
      tone: "rose",
      highlight: true,
    },
    {
      label: "Target goal (net)",
      value: formatINRCurrency(target),
      tone: "emerald",
    },
  ];

  if (!sameBasis) {
    rows.push({
      label: "Inflation-adjusted goal",
      value: formatINRCurrency(inflAdj),
    });
  }

  rows.push(
    {
      label: "Existing credit",
      value: formatINRCurrency(existingCredit),
      tone: "emerald",
    },
    {
      label: "Existing corpus FV",
      value: formatINRCurrency(corpusFv),
    },
    {
      label: "Existing SIP FV",
      value: formatINRCurrency(sipFv),
    },
    {
      label: "Horizon",
      value: `${tenureYears} year${tenureYears === 1 ? "" : "s"}`,
    },
  );

  return (
    <ModeSummaryTable
      title="Goal summary"
      subtitle="Shortfall after existing credit, with the target corpus on the goal date"
      rows={rows}
    />
  );
}

function ExistingSipResults({
  result,
  tenureYears,
  currentMonthlySip,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
  openDelay,
  onToggleDelay,
  chartTab: _chartTab,
  onChartTabChange: _onChartTabChange,
}: {
  result: GoalPlannerResult;
  tenureYears: number;
  currentMonthlySip: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
  openDelay: boolean;
  onToggleDelay: () => void;
  chartTab: "funding" | "compare";
  onChartTabChange: (tab: "funding" | "compare") => void;
}) {
  const [localTab, setLocalTab] = useState<"funding" | "compare">("funding");
  void _chartTab;
  void _onChartTabChange;
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

  const fundingChart = (
    <WealthMixDonut
      title="SIP1 + SIP2 corpus mix"
      centerLabel="Combined"
      centerValue={combinedCorpus}
      tax={standard ? sip2Tax : undefined}
      net={standard ? sip2Net : undefined}
      netLabel="Add. net"
      slices={[
        {
          name: "Existing invested",
          value: sip1Invested,
          color: wealthMixColors.invested,
        },
        {
          name: "Existing gain",
          value: sip1Gain,
          color: wealthMixColors.secondary,
        },
        {
          name: "Additional invested",
          value: sip2Invested,
          color: wealthMixColors.secondaryGain,
        },
        {
          name: "Additional gain",
          value: sip2Gain,
          color: wealthMixColors.gain,
        },
      ]}
    />
  );

  const compareChart = (
    <WealthCompareBars
      showBarLabels
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
        { key: "existing", label: "Existing", color: wealthChart.standard },
        { key: "additional", label: "Additional", color: wealthChart.stepUp },
      ]}
    />
  );

  const activeChart = localTab === "compare" ? compareChart : fundingChart;

  return (
    <GoalResultSections
      {...sectionSpread({
        openMilestones,
        onToggleMilestones,
        openAnalytics,
        onToggleAnalytics,
        openSchedule,
        onToggleSchedule,
        openDelay,
        onToggleDelay,
        tenureYears,
      })}
      milestones={
        <div className="space-y-4">
          <MetricGrid>
            <WealthMetricCard
              title="Existing SIP Credit"
              value={existing?.netCredit ?? 0}
              description="Keep current SIP running"
              badge="Credit"
              tone="neutral"
              footer={
                <>
                  Current SIP ·{" "}
                  <span className="font-semibold tabular-nums text-slate-700">
                    {formatINRCurrency(currentMonthlySip)}
                  </span>
                  /mo
                </>
              }
              mark={
                <WealthIconMark className="h-7 w-7">
                  <IconTarget className="h-3.5 w-3.5" />
                </WealthIconMark>
              }
            />
            <WealthMetricCard
              title="Additional SIP"
              value={standard?.monthlySip ?? 0}
              description="Extra flat monthly SIP"
              badge="Flat"
              tone="positive"
              footer={
                standard ? (
                  <>
                    Invested ·{" "}
                    <span className="font-semibold tabular-nums text-slate-700">
                      {formatINRCurrency(standard.invested)}
                    </span>
                    {" · Net "}
                    <span className="font-semibold tabular-nums text-emerald-700">
                      {formatINRCurrency(standard.netAfterTax)}
                    </span>
                  </>
                ) : undefined
              }
              mark={
                <WealthIconMark tone="emerald" className="h-7 w-7">
                  <IconSip className="h-3.5 w-3.5" />
                </WealthIconMark>
              }
            />
            <WealthMetricCard
              title="Step-up SIP"
              value={stepUp?.monthlySip ?? 0}
              description="Starting monthly SIP with annual step-up"
              badge="Step-up"
              tone="positive"
              footer={
                stepUp?.endMonthlySip != null ? (
                  <>
                    Ends at ·{" "}
                    <span className="font-semibold tabular-nums text-emerald-700">
                      {formatINRCurrency(stepUp.endMonthlySip)}
                    </span>
                    /mo
                  </>
                ) : undefined
              }
              mark={
                <WealthIconMark tone="emerald" className="h-7 w-7">
                  <IconStepUp className="h-3.5 w-3.5" />
                </WealthIconMark>
              }
            />
          </MetricGrid>
          {result.overfunded ? (
            <WealthStatusNote tone="info">
              Existing SIP already covers the goal. Additional funding is not required.
            </WealthStatusNote>
          ) : (
            <WealthStatusNote tone="info">
              Shortfall to fund · {formatINRCurrency(result.shortfall ?? 0)}. Keep the current SIP of{" "}
              {formatINRCurrency(currentMonthlySip)}/mo and add one of the paths below.
            </WealthStatusNote>
          )}
        </div>
      }
      analytics={
        <div className="space-y-5">
          <WealthAnalyticsChrome
            tabs={
              <WealthSegmented
                variant="underline"
                layoutId="existing-chart-tabs"
                value={localTab}
                onChange={setLocalTab}
                options={[
                  {
                    id: "funding",
                    label: "Funding",
                    icon: <IconDonut className="h-3.5 w-3.5" />,
                  },
                  {
                    id: "compare",
                    label: "Comparison",
                    icon: <IconChart className="h-3.5 w-3.5" />,
                  },
                ]}
              />
            }
          >
            <div className="min-w-0 overflow-hidden">{activeChart}</div>
          </WealthAnalyticsChrome>

          <div className="space-y-5">
            <ModeSummaryTable
              title="Goal summary"
              subtitle="Existing SIP credit with additional funding needed to hit the goal"
              rows={[
                {
                  label: "Shortfall to fund",
                  value: formatINRCurrency(result.shortfall ?? 0),
                  tone: "rose",
                  highlight: true,
                },
                {
                  label: "Target goal (net)",
                  value: formatINRCurrency(result.targetGoal),
                  tone: "emerald",
                },
                {
                  label: "Existing credit",
                  value: formatINRCurrency(existing?.netCredit ?? 0),
                  tone: "emerald",
                },
                {
                  label: "Existing FV",
                  value: formatINRCurrency(sip1Fv),
                },
                {
                  label: "Additional SIP",
                  value: formatINRCurrency(standard?.monthlySip ?? 0),
                },
                {
                  label: "Step-up SIP",
                  value: formatINRCurrency(stepUp?.monthlySip ?? 0),
                },
                {
                  label: "Lumpsum today",
                  value: formatINRCurrency(lumpsum?.lumpsum ?? 0),
                },
                {
                  label: "Horizon",
                  value: `${years} year${years === 1 ? "" : "s"}`,
                },
              ]}
            />

            <FundingPathsBoard lumpsum={lumpsum} standard={standard} stepUp={stepUp} />
          </div>
        </div>
      }
      audit={
        <GoalAuditBlock mode="existing" result={result} tenureYears={tenureYears}>
          <GoalScheduleTable mode="existing" rows={result.schedule} />
        </GoalAuditBlock>
      }
      milestonesSubtitle="Existing SIP credit and top-up paths"
      analyticsSubtitle="Existing vs additional mix and comparison"
      auditTitle="Existing SIP Ledger"
    />
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
          title: "Lumpsum today",
          heroLabel: "Pay once",
          heroValue: lumpsum.lumpsum,
          hint: "No monthly SIP",
          leg: lumpsum,
          mark: (
            <WealthIconMark className="h-7 w-7">
              <IconChart className="h-3.5 w-3.5" />
            </WealthIconMark>
          ),
        }
      : null,
    standard
      ? {
          key: "sip",
          title: "Additional SIP",
          heroLabel: "Monthly SIP",
          heroValue: standard.monthlySip,
          hint: "Flat for the full tenure",
          leg: standard,
          mark: (
            <WealthIconMark tone="emerald" className="h-7 w-7">
              <IconSip className="h-3.5 w-3.5" />
            </WealthIconMark>
          ),
        }
      : null,
    stepUp
      ? {
          key: "step",
          title: "Step-up SIP",
          heroLabel: "Starts at",
          heroValue: stepUp.monthlySip,
          hint:
            stepUp.endMonthlySip != null
              ? `Ends at ${formatINRCurrency(stepUp.endMonthlySip)} / mo`
              : "Rises each year",
          leg: stepUp,
          mark: (
            <WealthIconMark tone="emerald" className="h-7 w-7">
              <IconStepUp className="h-3.5 w-3.5" />
            </WealthIconMark>
          ),
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    title: string;
    heroLabel: string;
    heroValue: number;
    hint: string;
    leg: GoalLeg;
    mark: ReactNode;
  }>;

  if (paths.length === 0) return null;

  const ranked = [...paths].sort((a, b) => a.leg.invested - b.leg.invested);
  const rankLabel = new Map<string, string>();
  const labels = ["Least capital", "Mid capital", "Most capital"];
  ranked.forEach((path, i) => {
    rankLabel.set(path.key, labels[Math.min(i, labels.length - 1)]!);
  });

  return (
    <div className={muted ? "opacity-70" : undefined}>
      <div className="mb-4">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
          Funding paths
        </div>
        <h3 className="mt-1.5 text-[15px] font-medium tracking-tight text-slate-900">
          Cover the shortfall
        </h3>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-500">
          Three ways to reach the same net after tax. The least-capital path needs the
          smallest total outlay.
        </p>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-3">
        {paths.map((path) => {
          const badge = rankLabel.get(path.key);
          const isLeast = badge === "Least capital";
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
                {badge ? (
                  <span
                    className={
                      isLeast
                        ? "rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                        : "rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500"
                    }
                  >
                    {badge}
                  </span>
                ) : null}
              </div>

              <div className="mt-3">
                <div className="text-[13px] text-slate-500">{path.heroLabel}</div>
                <div className="mt-0.5 text-[24px] font-medium tracking-tight tabular-nums text-slate-900">
                  {formatINRCurrency(path.heroValue)}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{path.hint}</p>
              </div>

              <dl className="mt-auto space-y-0 border-t border-slate-100 pt-1">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className={
                      row.tone === "net"
                        ? "mt-1 flex items-baseline justify-between gap-4 rounded-xl bg-emerald-50/70 px-3 py-2.5"
                        : "flex items-baseline justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0"
                    }
                  >
                    <dt
                      className={
                        row.tone === "net"
                          ? "text-[14px] font-medium text-emerald-800/80"
                          : "text-[14px] text-slate-500"
                      }
                    >
                      {row.label}
                    </dt>
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

function LegMetricCard({ title, leg }: { title: string; leg: GoalLeg }) {
  const isLumpsum = leg.lumpsum != null;
  const heroLabel = isLumpsum ? "Lumpsum today" : "Monthly SIP";
  const heroValue = isLumpsum ? (leg.lumpsum ?? 0) : leg.monthlySip;
  const rows = [
    { label: "Invested", value: leg.invested, tone: "neutral" as const },
    { label: "Gain", value: leg.gain, tone: "emerald" as const },
    { label: "Tax", value: leg.tax, tone: "rose" as const },
    { label: "Net after tax", value: leg.netAfterTax, tone: "net" as const },
  ];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_8px_24px_rgba(15,23,42,0.04)] sm:px-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
        {title}
      </div>
      <div className="mt-3">
        <div className="text-[13px] text-slate-500">{heroLabel}</div>
        <div className="mt-0.5 text-[24px] font-medium tracking-tight tabular-nums text-slate-900">
          {formatINRCurrency(heroValue)}
        </div>
      </div>
      <dl className="mt-auto space-y-0 border-t border-slate-100 pt-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className={
              row.tone === "net"
                ? "mt-1 flex items-baseline justify-between gap-4 rounded-xl bg-emerald-50/70 px-3 py-2.5"
                : "flex items-baseline justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0"
            }
          >
            <dt
              className={
                row.tone === "net"
                  ? "text-[14px] font-medium text-emerald-800/80"
                  : "text-[14px] text-slate-500"
              }
            >
              {row.label}
            </dt>
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
}

function renderGoalCharts(
  mode: Mode,
  result: GoalPlannerResult,
  tenureYears: number,
  chartTab: "funding" | "compare" = "funding",
  onChartTabChange?: (tab: "funding" | "compare") => void,
) {
  const req = goalRequiredChart(mode, result);
  const extra = goalExtraChart(mode, result, tenureYears);

  if (!extra) {
    return <div className="min-w-0 overflow-hidden pt-1">{req}</div>;
  }

  const active = chartTab === "compare" ? extra : req;
  return (
    <WealthAnalyticsChrome
      tabs={
        <WealthSegmented
          variant="underline"
          layoutId={`goal-chart-${mode}`}
          value={chartTab}
          onChange={(id) => onChartTabChange?.(id)}
          options={[
            {
              id: "funding",
              label: "Funding",
              icon: <IconDonut className="h-3.5 w-3.5" />,
            },
            {
              id: "compare",
              label: "Comparison",
              icon: <IconChart className="h-3.5 w-3.5" />,
            },
          ]}
        />
      }
    >
      <div className="min-w-0 overflow-hidden">{active}</div>
    </WealthAnalyticsChrome>
  );
}

function GoalHero({ mode, result }: { mode: Mode; result: GoalPlannerResult }) {
  if (mode === "sip" && result.standard && result.stepUp) {
    return (
      <MetricGrid>
        <WealthMetricCard
          title="Standard SIP"
          value={result.standard.monthlySip}
          description="Required monthly SIP to reach the target"
          badge="Flat"
          tone="neutral"
          mark={
            <WealthIconMark className="h-7 w-7">
              <IconSip className="h-3.5 w-3.5" />
            </WealthIconMark>
          }
        />
        <WealthMetricCard
          title="Step-Up SIP"
          value={result.stepUp.monthlySip}
          description="Starting monthly SIP with annual step-up"
          tone="positive"
          mark={
            <WealthIconMark tone="emerald" className="h-7 w-7">
              <IconStepUp className="h-3.5 w-3.5" />
            </WealthIconMark>
          }
        />
        <WealthMetricCard
          title="Target Corpus"
          value={result.targetGoal}
          description="Net after capital gains tax"
          tone="accent"
          mark={
            <WealthIconMark className="h-7 w-7">
              <IconTarget className="h-3.5 w-3.5" />
            </WealthIconMark>
          }
        />
      </MetricGrid>
    );
  }
  if (result.standard) {
    return (
      <MetricGrid>
        <WealthMetricCard
          title="Target Goal"
          value={result.targetGoal}
          description="Net after capital gains tax"
          tone="accent"
          mark={
            <WealthIconMark className="h-7 w-7">
              <IconTarget className="h-3.5 w-3.5" />
            </WealthIconMark>
          }
        />
        <WealthMetricCard
          title={result.standard.lumpsum != null ? "Additional Lumpsum" : "Additional SIP"}
          value={result.standard.lumpsum ?? result.standard.monthlySip}
          description={
            result.standard.lumpsum != null
              ? "One-time amount today"
              : "Monthly SIP still required"
          }
          tone="positive"
          mark={
            <WealthIconMark tone="emerald" className="h-7 w-7">
              <IconSip className="h-3.5 w-3.5" />
            </WealthIconMark>
          }
        />
      </MetricGrid>
    );
  }
  return (
    <MetricGrid>
      <WealthMetricCard
        title="Target Goal"
        value={result.targetGoal}
        description="Net after capital gains tax"
        tone="accent"
      />
      <WealthMetricCard
        title="Inflation-Adjusted"
        value={result.inflAdjGoal}
        description="Goal grown for inflation"
        tone="neutral"
      />
    </MetricGrid>
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
        { category: "Gain" },
        Object.fromEntries(legs.map((l) => [l.key, l.leg.gain])),
      ),
      Object.assign(
        { category: "Tax" },
        Object.fromEntries(legs.map((l) => [l.key, l.leg.tax])),
      ),
      Object.assign(
        { category: "Net" },
        Object.fromEntries(legs.map((l) => [l.key, l.leg.netAfterTax])),
      ),
    ] as Array<{ category: string; [k: string]: string | number }>,
    series: legs.map((l) => ({ key: l.key, label: l.label, color: l.color })),
  };
}

function goalRequiredChart(mode: Mode, result: GoalPlannerResult): ReactNode {
  if (mode === "sip" && result.standard && result.stepUp) {
    const { data, series } = investedTaxCorpus([
      { key: "sip", label: "Standard SIP", color: wealthChart.standard, leg: result.standard },
      { key: "step", label: "Step-up SIP", color: wealthChart.stepUp, leg: result.stepUp },
    ]);
    return (
      <WealthCompareBars
        data={data}
        series={series}
        height="h-[300px] sm:h-[340px]"
        showBarLabels
      />
    );
  }

  if (mode === "current" && result.lumpsum && result.standard && result.stepUp && result.existing) {
    return (
      <WealthWaterfallBars
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
      <WealthMixDonut
        title="Mix: corpus / lumpsum / SIP"
        centerLabel="Mix"
        centerValue={
          (result.existingCredit ?? 0) +
          (result.extraLumpsum ?? 0) +
          result.standard.invested +
          result.standard.gain
        }
        tax={result.standard.tax}
        net={result.standard.netAfterTax}
        netLabel="SIP net"
        slices={[
          {
            name: "Current corpus credit",
            value: result.existingCredit ?? 0,
            color: wealthMixColors.invested,
          },
          {
            name: "Extra lumpsum",
            value: result.extraLumpsum ?? 0,
            color: wealthMixColors.secondary,
          },
          {
            name: "SIP invested",
            value: result.standard.invested,
            color: wealthMixColors.invested,
          },
          {
            name: "SIP gain",
            value: result.standard.gain,
            color: wealthMixColors.gain,
          },
        ]}
      />
    );
  }

  if (mode === "existing" && result.existing && result.standard) {
    return (
      <WealthMixDonut
        title="Existing SIP vs additional SIP"
        centerLabel="Corpus"
        centerValue={result.existing.sipFv + result.standard.maturity}
        tax={result.standard.tax}
        net={result.standard.netAfterTax}
        netLabel="Add. net"
        slices={[
          {
            name: "SIP1 invested",
            value: result.existing.sipInvested ?? result.existing.totalInvested,
            color: wealthMixColors.invested,
          },
          {
            name: "SIP2 invested",
            value: result.standard.invested,
            color: wealthMixColors.secondary,
          },
          {
            name: "SIP2 gain",
            value: result.standard.gain,
            color: wealthMixColors.gain,
          },
        ]}
      />
    );
  }

  if (mode === "periodic" && result.periodic) {
    return (
      <WealthWaterfallBars
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
    );
  }

  return null;
}

function goalExtraChart(mode: Mode, result: GoalPlannerResult, tenureYears = 15): ReactNode {
  if (mode === "sip") {
    return null;
  }

  if (mode === "current" && result.existing && result.lumpsum && result.standard && result.stepUp) {
    const sipTotal = result.standard.invested;
    const stepTotal = result.stepUp.invested;
    const lsToday = result.lumpsum.lumpsum ?? 0;
    return (
      <WealthCompareBars
        showBarLabels
        data={[
          {
            category: "Extra lumpsum",
            amount: lsToday,
          },
          {
            category: "Extra SIP",
            amount: sipTotal,
          },
          {
            category: "Extra step-up",
            amount: stepTotal,
          },
        ]}
        series={[{ key: "amount", label: "Total capital", color: wealthChart.invested }]}
      />
    );
  }

  if (mode === "ls-sip" && result.allLumpsum != null && result.allSip != null) {
    const years = result.schedule.length || tenureYears;
    const allSipTotal = result.allSip * 12 * years;
    const mixSipTotal = (result.mixSip ?? 0) * 12 * years;
    const mixTotal = (result.extraLumpsum ?? 0) + mixSipTotal;
    return (
      <WealthCompareBars
        showBarLabels
        data={[
          {
            category: "All lumpsum",
            amount: result.allLumpsum,
          },
          {
            category: "All SIP",
            amount: allSipTotal,
          },
          {
            category: "Mix",
            amount: mixTotal,
          },
        ]}
        series={[{ key: "amount", label: "Total capital", color: wealthChart.invested }]}
      />
    );
  }

  if (mode === "existing" && result.existing && result.standard) {
    return (
      <WealthCompareBars
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
          { key: "existing", label: "Existing", color: wealthChart.standard },
          { key: "additional", label: "Additional", color: wealthChart.stepUp },
        ]}
      />
    );
  }

  if (mode === "periodic" && result.standard && result.stepUp) {
    return (
      <WealthCompareBars
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
          { key: "sip", label: "Remaining SIP", color: wealthChart.standard },
          { key: "step", label: "Remaining step-up", color: wealthChart.stepUp },
        ]}
      />
    );
  }

  if (mode === "compounding" && result.standard) {
    return (
      <WealthMixDonut
        title="SIP at goal year"
        centerLabel="Corpus"
        centerValue={result.standard.maturity}
        tax={result.standard.tax}
        net={result.standard.netAfterTax}
        netLabel="Net after tax"
        slices={[
          { name: "Invested", value: result.standard.invested, color: wealthMixColors.invested },
          { name: "Gain", value: result.standard.gain, color: wealthMixColors.gain },
        ]}
      />
    );
  }

  return null;
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
