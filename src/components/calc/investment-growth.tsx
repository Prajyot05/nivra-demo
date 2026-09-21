"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import {
  formatINRCurrency,
  formatPercent,
  SelectInput,
  ageError,
  emailError,
  nameError,
  phoneError,
  rateError,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { GrowthLumpsum } from "@/components/calc/growth-lumpsum";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import {
  PeriodicInvestmentDossier,
  PERIODIC_INVESTMENT_REPORT_ID,
} from "@/components/reports/periodic-investment-dossier";
import {
  SipCalculatorDossier,
  SIP_CALCULATOR_REPORT_ID,
} from "@/components/reports/sip-calculator-dossier";
import {
  SipStepUpCalculatorDossier,
  SIP_STEPUP_CALCULATOR_REPORT_ID,
} from "@/components/reports/sip-stepup-calculator-dossier";
import { useCalculate } from "@/hooks/use-calculate";
import { useCalculatorMode } from "@/hooks/use-calculator-mode";
import { getCalculatorPageTitle } from "@/lib/calculator-nav";
import {
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
  IconTax,
  moneyCell,
  WEALTH_CONTENT_CLASS,
  WealthAgeField,
  WealthAuditChip,
  WealthAuditLedger,
  WealthDataTable,
  WealthDisclaimer,
  WealthGrowthLine,
  WealthHero,
  WealthIconMark,
  WealthMetricCard,
  WealthMixDonut,
  WealthMoneyField,
  WealthPercentField,
  WealthProfileGrid,
  WealthSection,
  WealthSegmented,
  WealthStatusNote,
  WealthTextField,
  WealthYearField,
  wealthChart,
  wealthMixColors,
  WEALTH_MONEY_PRESETS_DEFAULT,
  WEALTH_YEAR_PRESETS_DEFAULT,
} from "@/components/wealth";

const MODES = [
  { id: "sip", label: "SIP" },
  { id: "stepup", label: "Step-up" },
  { id: "lumpsum", label: "Lumpsum" },
  { id: "periodic", label: "Periodic" },
] as const;

type Mode = (typeof MODES)[number]["id"];
const MODE_IDS = MODES.map((m) => m.id);

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
const PERIODIC_AMOUNT_MIN = 10_000;
const PERIODIC_AMOUNT_MAX = 10_00_00_000;
const YEARS_SLIDER_MAX = 40;

const FREQUENCY_OPTIONS = [
  { value: "12", label: "Monthly" },
  { value: "4", label: "Quarterly" },
  { value: "2", label: "Half-Yearly" },
  { value: "1", label: "Yearly" },
  { value: "6", label: "Every 2 months" },
  { value: "3", label: "Every 4 months" },
];

const VALID_TIMES_PER_YEAR = new Set([1, 2, 3, 4, 6, 12]);

const MODE_META: Record<
  Exclude<Mode, "lumpsum">,
  { strategy: string; goal: string; description: string; assumptionsBlurb: string }
> = {
  sip: {
    strategy: "Monthly SIP compounding",
    goal: "Capital growth",
    description: "Monthly SIP with inflation, tax, and cost of delay.",
    assumptionsBlurb:
      "Client identity, SIP parameters, and market rate settings for monthly growth",
  },
  stepup: {
    strategy: "Step-up SIP compounding",
    goal: "Rising contribution growth",
    description: "Annual step-up SIP with inflation and tax impact.",
    assumptionsBlurb:
      "Client identity, step-up SIP parameters, and market rate settings",
  },
  periodic: {
    strategy: "Periodic contribution compounding",
    goal: "Scheduled investing",
    description: "Fixed contributions at a chosen frequency through the tenure.",
    assumptionsBlurb:
      "Client identity, contribution schedule, and return/tax assumptions",
  },
};

function frequencyLabel(timesPerYear: number): string {
  return FREQUENCY_OPTIONS.find((o) => o.value === String(timesPerYear))?.label ?? "Unknown";
}

function frequencyHint(timesPerYear: number): string {
  switch (timesPerYear) {
    case 12:
      return "12 contributions per year";
    case 6:
      return "6 contributions per year";
    case 4:
      return "4 contributions per year";
    case 3:
      return "3 contributions per year";
    case 2:
      return "2 contributions per year";
    case 1:
      return "1 contribution per year";
    default:
      return "Select a contribution frequency";
  }
}

type YearRow = {
  year: number;
  monthly: number;
  investedToDate: number;
  yearEnd: number;
  inflationAdjusted?: number;
};

type PeriodicRow = {
  month: number;
  contribution: number;
  contributionFv: number;
};

type GrowthResult = {
  maturity: number;
  totalInvested: number;
  gain: number;
  tax: number;
  netAfterTax: number;
  inflationAdjusted?: number;
  inflationAdjustedGain?: number;
  delayedMaturity?: number | null;
  costOfDelay?: number | null;
  startMonthly?: number;
  endMonthly?: number;
  payments?: number;
  schedule: Array<YearRow | PeriodicRow>;
};

const CALCULATOR_ID: Record<Exclude<Mode, "lumpsum">, string> = {
  sip: "growth-sip",
  stepup: "growth-stepup",
  periodic: "growth-periodic",
};

function GrowthModeTabs({
  mode,
  onModeChange,
}: {
  mode: Mode;
  onModeChange: (next: Mode) => void;
}) {
  return (
    <WealthSegmented
      fullWidth
      layoutId="growth-mode-pill"
      value={mode}
      onChange={onModeChange}
      options={[
        {
          id: "sip",
          label: "SIP",
          icon: <IconSip className="h-3.5 w-3.5" />,
        },
        {
          id: "stepup",
          label: "Step-up",
          icon: <IconStepUp className="h-3.5 w-3.5" />,
        },
        {
          id: "lumpsum",
          label: "Lumpsum",
          icon: <IconChart className="h-3.5 w-3.5" />,
        },
        {
          id: "periodic",
          label: "Periodic",
          icon: <IconCalendar className="h-3.5 w-3.5" />,
        },
      ]}
    />
  );
}

export function InvestmentGrowth() {
  const [mode, setMode] = useCalculatorMode(MODE_IDS, "lumpsum");
  if (mode === "lumpsum") {
    return <GrowthLumpsum />;
  }

  return <InvestmentGrowthModes mode={mode} onModeChange={setMode} />;
}

function InvestmentGrowthModes({
  mode,
  onModeChange,
}: {
  mode: Exclude<Mode, "lumpsum">;
  onModeChange: (next: Mode) => void;
}) {
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(30);
  const [email, setEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [phone, setPhone] = useState(DUMMY_REPORT_CONTACT.phone);

  const [sipMonthly, setSipMonthly] = useState(1_500);
  const [sipYears, setSipYears] = useState(5);
  const [investYears, setInvestYears] = useState(5);
  const [sipReturn, setSipReturn] = useState(12);
  const [sipInflation, setSipInflation] = useState(5.75);
  const [sipDelay, setSipDelay] = useState(6);
  const [sipTax, setSipTax] = useState(0);

  const [stepStart, setStepStart] = useState(5_000);
  const [stepYears, setStepYears] = useState(10);
  const [stepReturn, setStepReturn] = useState(12);
  const [stepUpPct, setStepUpPct] = useState(10);
  const [stepInflation, setStepInflation] = useState(5.75);
  const [stepTax, setStepTax] = useState(0);

  const [periodicAmount, setPeriodicAmount] = useState(100_000);
  const [timesPerYear, setTimesPerYear] = useState(2);
  const [periodicYears, setPeriodicYears] = useState(1);
  const [periodicReturn, setPeriodicReturn] = useState(12);
  const [periodicTax, setPeriodicTax] = useState(12);

  const [openAssumptions, setOpenAssumptions] = useState(true);
  const [openMilestones, setOpenMilestones] = useState(true);
  const [openAnalytics, setOpenAnalytics] = useState(true);
  const [openSchedule, setOpenSchedule] = useState(true);
  const assumptionsRef = useRef<HTMLDivElement>(null);

  const clientNameError = nameError(name);
  const clientAgeError = ageError(age);
  const clientEmailError = emailError(email);
  const clientPhoneError = phoneError(phone);

  const sipMonthlyError =
    !Number.isFinite(sipMonthly) || sipMonthly <= 0 ? "Monthly SIP is required." : undefined;
  const sipYearsError =
    !Number.isFinite(sipYears) || sipYears < 1 ? "SIP years must be at least 1." : undefined;
  const sipHorizonError =
    !Number.isFinite(investYears) || investYears < 1
      ? "Horizon must be at least 1 year."
      : sipYears > investYears
        ? "SIP duration cannot be greater than investment horizon."
        : undefined;
  const sipReturnError = rateError(sipReturn, "Return");
  const sipInflationError = rateError(sipInflation, "Inflation");
  const sipDelayError =
    !Number.isFinite(sipDelay) || sipDelay < 0
      ? "Delay cannot be negative."
      : sipDelay > investYears * 12
        ? "Delay cannot exceed the investment horizon."
        : undefined;
  const sipTaxError = rateError(sipTax, "Tax");

  const stepStartError =
    !Number.isFinite(stepStart) || stepStart <= 0 ? "Start SIP is required." : undefined;
  const stepYearsError =
    !Number.isFinite(stepYears) || stepYears < 1 ? "SIP years must be at least 1." : undefined;
  const stepReturnError = rateError(stepReturn, "Return");
  const stepUpPctError = rateError(stepUpPct, "Step-up");
  const stepInflationError = rateError(stepInflation, "Inflation");
  const stepTaxError = rateError(stepTax, "Tax");

  const periodicAmountError =
    !Number.isFinite(periodicAmount) || periodicAmount <= 0
      ? "Amount each is required."
      : undefined;
  const periodicYearsError =
    !Number.isFinite(periodicYears) || periodicYears < 1
      ? "Tenure must be at least 1 year."
      : undefined;
  const periodicReturnError = rateError(periodicReturn, "Return");
  const periodicTaxError = rateError(periodicTax, "Tax");
  const periodicFreqError = !VALID_TIMES_PER_YEAR.has(timesPerYear)
    ? "Select a contribution frequency."
    : undefined;

  const fieldErrors = [
    clientNameError,
    clientAgeError,
    clientEmailError,
    clientPhoneError,
    ...(mode === "sip"
      ? [
          sipMonthlyError,
          sipYearsError,
          sipHorizonError,
          sipReturnError,
          sipInflationError,
          sipDelayError,
          sipTaxError,
        ]
      : mode === "stepup"
        ? [
            stepStartError,
            stepYearsError,
            stepReturnError,
            stepUpPctError,
            stepInflationError,
            stepTaxError,
          ]
        : [
            periodicAmountError,
            periodicYearsError,
            periodicReturnError,
            periodicTaxError,
            periodicFreqError,
          ]),
  ].filter((msg): msg is string => Boolean(msg));

  const canCalculate = fieldErrors.length === 0;

  const horizonYears =
    mode === "sip" ? investYears : mode === "stepup" ? stepYears : periodicYears;

  const input = useMemo(() => {
    switch (mode) {
      case "sip":
        return {
          clientName: name,
          age,
          monthlyInvestment: sipMonthly,
          sipYears,
          investYears,
          returnPct: sipReturn,
          inflationPct: sipInflation,
          delayMonths: Math.max(0, Math.round(sipDelay)),
          taxPct: sipTax,
        };
      case "stepup":
        return {
          clientName: name,
          age,
          startMonthly: stepStart,
          sipYears: stepYears,
          returnPct: stepReturn,
          stepUpPct,
          inflationPct: stepInflation,
          taxPct: stepTax,
        };
      case "periodic":
        return {
          clientName: name,
          age,
          amount: periodicAmount,
          timesPerYear,
          years: periodicYears,
          returnPct: periodicReturn,
          taxPct: periodicTax,
        };
    }
  }, [
    mode,
    name,
    age,
    sipMonthly,
    sipYears,
    investYears,
    sipReturn,
    sipInflation,
    sipDelay,
    sipTax,
    stepStart,
    stepYears,
    stepReturn,
    stepUpPct,
    stepInflation,
    stepTax,
    periodicAmount,
    timesPerYear,
    periodicYears,
    periodicReturn,
    periodicTax,
  ]);

  const { result, error, loading } = useCalculate<GrowthResult>(
    CALCULATOR_ID[mode],
    input,
    canCalculate,
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const resetDefaults = () => {
    setName("Mr. Anshu Kaul");
    setAge(30);
    setEmail(DUMMY_REPORT_CONTACT.email);
    setPhone(DUMMY_REPORT_CONTACT.phone);
    setSipMonthly(1_500);
    setSipYears(5);
    setInvestYears(5);
    setSipReturn(12);
    setSipInflation(5.75);
    setSipDelay(6);
    setSipTax(0);
    setStepStart(5_000);
    setStepYears(10);
    setStepReturn(12);
    setStepUpPct(10);
    setStepInflation(5.75);
    setStepTax(0);
    setPeriodicAmount(100_000);
    setTimesPerYear(2);
    setPeriodicYears(1);
    setPeriodicReturn(12);
    setPeriodicTax(12);
  };

  const handleDownload = async () => {
    if (!result || isDownloading) return;

    const safeName = (name || "client")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    const reportByMode: Partial<
      Record<Exclude<Mode, "lumpsum">, { id: string; filename: string }>
    > = {
      sip: { id: SIP_CALCULATOR_REPORT_ID, filename: `sip-calculator-${safeName || "report"}` },
      stepup: {
        id: SIP_STEPUP_CALCULATOR_REPORT_ID,
        filename: `sip-stepup-calculator-${safeName || "report"}`,
      },
      periodic: {
        id: PERIODIC_INVESTMENT_REPORT_ID,
        filename: `periodic-investment-${safeName || "report"}`,
      },
    };

    const report = reportByMode[mode];
    if (!report) return;

    setIsDownloading(true);
    try {
      await generatePdfFromElement(report.id, report.filename);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const scrollToAssumptions = () => {
    setOpenAssumptions(true);
    assumptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const meta = MODE_META[mode];

  return (
    <>
      <CalculatorPage
        title={getCalculatorPageTitle("/growth", mode)}
        description={meta.description}
        contentClassName={WEALTH_CONTENT_CLASS}
        actions={
          <ReportDownloadButton
            onClick={handleDownload}
            disabled={!result}
            loading={isDownloading}
          />
        }
        modes={<GrowthModeTabs mode={mode} onModeChange={onModeChange} />}
        header={
          <WealthHero
            clientName={name}
            age={age}
            email={email}
            phone={phone}
            goalLabel={meta.goal}
            tenure={horizonYears}
            strategy={meta.strategy}
            metrics={[
              {
                label: "Maturity",
                value: result?.maturity ?? 0,
                kind: "currency",
                tone: "emerald",
                mark: (
                  <WealthIconMark tone="emerald" className="h-6 w-6">
                    <IconTarget className="h-3.5 w-3.5" />
                  </WealthIconMark>
                ),
              },
              {
                label: "Invested",
                value: result?.totalInvested ?? 0,
                kind: "currency",
                tone: "slate",
                mark: (
                  <WealthIconMark className="h-6 w-6">
                    <IconSip className="h-3.5 w-3.5" />
                  </WealthIconMark>
                ),
              },
              {
                label: "Net after tax",
                value: result?.netAfterTax ?? 0,
                kind: "currency",
                tone: "slate",
                mark: (
                  <WealthIconMark className="h-6 w-6">
                    <IconTax className="h-3.5 w-3.5" />
                  </WealthIconMark>
                ),
              },
            ]}
            onEdit={scrollToAssumptions}
          />
        }
        form={
          <div ref={assumptionsRef}>
          <WealthSection
            id="assumptions"
            badge="01 · Profile"
            title="Investor Profile and Assumptions"
            subtitle={meta.assumptionsBlurb}
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
            <div className="w-full px-0">
              {mode === "sip" ? (
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
                    label="Monthly SIP"
                    value={sipMonthly}
                    onChange={setSipMonthly}
                    error={sipMonthlyError}
                    max={SIP_AMOUNT_MAX}
                    slider={{
                      min: SIP_AMOUNT_MIN,
                      max: SIP_AMOUNT_MAX,
                      step: 1_000,
                      scale: "log",
                      presets: SIP_AMOUNT_PRESETS,
                    }}
                  />
                  <WealthYearField
                    label="SIP years"
                    value={sipYears}
                    min={1}
                    max={100}
                    onChange={setSipYears}
                    error={
                      sipYearsError ??
                      (sipYears > investYears ? sipHorizonError : undefined)
                    }
                    slider={{
                      min: 1,
                      max: YEARS_SLIDER_MAX,
                      step: 1,
                      presets: WEALTH_YEAR_PRESETS_DEFAULT,
                    }}
                  />
                  <WealthYearField
                    label="Horizon"
                    value={investYears}
                    min={1}
                    max={100}
                    suffix="Years"
                    onChange={setInvestYears}
                    error={sipHorizonError}
                    slider={{
                      min: 1,
                      max: YEARS_SLIDER_MAX,
                      step: 1,
                      presets: WEALTH_YEAR_PRESETS_DEFAULT,
                    }}
                  />
                  <WealthYearField
                    label="Delay"
                    value={sipDelay}
                    min={0}
                    max={1200}
                    suffix="Months"
                    onChange={(v) => setSipDelay(Math.max(0, v))}
                    error={sipDelayError}
                  />
                  <WealthPercentField
                    label="Return"
                    value={sipReturn}
                    onChange={(v) => setSipReturn(Math.max(0, v))}
                    error={sipReturnError}
                  />
                  <WealthPercentField
                    label="Inflation"
                    value={sipInflation}
                    onChange={(v) => setSipInflation(Math.max(0, v))}
                    error={sipInflationError}
                  />
                  <WealthPercentField
                    label="Tax"
                    value={sipTax}
                    onChange={(v) => setSipTax(Math.max(0, v))}
                    error={sipTaxError}
                  />
                </WealthProfileGrid>
              </div>
              ) : mode === "stepup" ? (
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
                    label="Start SIP"
                    value={stepStart}
                    onChange={setStepStart}
                    error={stepStartError}
                    max={SIP_AMOUNT_MAX}
                    slider={{
                      min: SIP_AMOUNT_MIN,
                      max: SIP_AMOUNT_MAX,
                      step: 1_000,
                      scale: "log",
                      presets: SIP_AMOUNT_PRESETS,
                    }}
                  />
                  <WealthYearField
                    label="SIP years"
                    value={stepYears}
                    min={1}
                    max={100}
                    onChange={setStepYears}
                    error={stepYearsError}
                    slider={{
                      min: 1,
                      max: YEARS_SLIDER_MAX,
                      step: 1,
                      presets: WEALTH_YEAR_PRESETS_DEFAULT,
                    }}
                  />
                  <WealthPercentField
                    label="Step-up"
                    value={stepUpPct}
                    onChange={(v) => setStepUpPct(Math.max(0, v))}
                    error={stepUpPctError}
                  />
                  <WealthPercentField
                    label="Return"
                    value={stepReturn}
                    onChange={(v) => setStepReturn(Math.max(0, v))}
                    error={stepReturnError}
                  />
                  <WealthPercentField
                    label="Inflation"
                    value={stepInflation}
                    onChange={(v) => setStepInflation(Math.max(0, v))}
                    error={stepInflationError}
                  />
                  <WealthPercentField
                    label="Tax"
                    value={stepTax}
                    onChange={(v) => setStepTax(Math.max(0, v))}
                    error={stepTaxError}
                  />
                </WealthProfileGrid>
              </div>
              ) : (
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
                    label="Amount each"
                    value={periodicAmount}
                    onChange={setPeriodicAmount}
                    error={periodicAmountError}
                    max={PERIODIC_AMOUNT_MAX}
                    slider={{
                      min: PERIODIC_AMOUNT_MIN,
                      max: PERIODIC_AMOUNT_MAX,
                      step: 1_00_000,
                      scale: "log",
                      presets: WEALTH_MONEY_PRESETS_DEFAULT,
                    }}
                  />
                  <div className="min-w-0">
                    <SelectInput
                      label="Freq / yr"
                      value={String(timesPerYear)}
                      onChange={(value) => setTimesPerYear(Number(value))}
                      options={FREQUENCY_OPTIONS}
                      hint={frequencyHint(timesPerYear)}
                      error={periodicFreqError}
                      className="min-w-0 w-full text-[13px]"
                    />
                  </div>
                  <WealthYearField
                    label="Tenure"
                    value={periodicYears}
                    min={1}
                    max={50}
                    suffix="Years"
                    onChange={setPeriodicYears}
                    error={periodicYearsError}
                    slider={{
                      min: 1,
                      max: YEARS_SLIDER_MAX,
                      step: 1,
                      presets: WEALTH_YEAR_PRESETS_DEFAULT,
                    }}
                  />
                  <WealthPercentField
                    label="Return"
                    value={periodicReturn}
                    onChange={(v) => setPeriodicReturn(Math.max(0, v))}
                    error={periodicReturnError}
                  />
                  <WealthPercentField
                    label="Tax"
                    value={periodicTax}
                    onChange={(v) => setPeriodicTax(Math.max(0, v))}
                    error={periodicTaxError}
                  />
                </WealthProfileGrid>
              </div>
              )}
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
              <GrowthResults
                mode={mode}
                result={result}
                timesPerYear={timesPerYear}
                horizonYears={horizonYears}
                delayMonths={mode === "sip" ? sipDelay : 0}
                openMilestones={openMilestones}
                onToggleMilestones={() => setOpenMilestones((v) => !v)}
                openAnalytics={openAnalytics}
                onToggleAnalytics={() => setOpenAnalytics((v) => !v)}
                openSchedule={openSchedule}
                onToggleSchedule={() => setOpenSchedule((v) => !v)}
              />
            ) : null}
          </>
        }
        footer={
          <WealthDisclaimer
            notes={
              mode === "sip"
                ? [
                    "Unplanned delay permanently compresses the compounding runway under the same return path.",
                    "Headline maturity is not purchasing power. Frame conversations on the inflation-adjusted corpus.",
                    "Tax is applied on gains only. Net after tax is the amount available to the investor at exit.",
                    "Projections are illustrative. Actual market returns and tax rules can differ.",
                  ]
                : mode === "stepup"
                  ? [
                      "Step-up increases contributions each year at the stated rate; actual SIP changes may differ.",
                      "Headline maturity is not purchasing power. Frame conversations on the inflation-adjusted corpus.",
                      "Tax is applied on gains only. Net after tax is the amount available to the investor at exit.",
                      "Projections are illustrative. Actual market returns and tax rules can differ.",
                    ]
                  : [
                      "Each contribution compounds only for the remaining horizon after it is paid.",
                      "Tax is applied on gains only. Net after tax is the amount available to the investor at exit.",
                      "Projections are illustrative. Actual market returns and tax rules can differ.",
                    ]
            }
          >
            {mode === "sip" ? (
              <>
                Figures are for illustration only. SIP projections compound as modeled with the
                stated return, inflation, and tax assumptions. Markets carry risk; past performance
                does not guarantee future results.
              </>
            ) : mode === "stepup" ? (
              <>
                Figures are for illustration only. Step-up SIP projections increase contributions
                annually at the stated rate. Tax depends on the investor&apos;s applicable rules.
                Markets carry risk; past performance does not guarantee future results.
              </>
            ) : (
              <>
                Figures are for illustration only. Periodic contributions apply the stated return
                and tax assumptions to each scheduled payment. Markets carry risk; past performance
                does not guarantee future results.
              </>
            )}
          </WealthDisclaimer>
        }
      />
      {mode === "sip" && result && result.inflationAdjusted != null ? (
        <SipCalculatorDossier
          data={{
            clientName: name,
            age,
            email,
            phone,
            monthlyInvestment: sipMonthly,
            sipYears,
            investYears,
            returnPct: sipReturn,
            inflationPct: sipInflation,
            taxPct: sipTax,
            delayMonths: sipDelay,
            maturity: result.maturity,
            totalInvested: result.totalInvested,
            gain: result.gain,
            tax: result.tax,
            netAfterTax: result.netAfterTax,
            inflationAdjusted: result.inflationAdjusted,
            inflationAdjustedGain: result.inflationAdjustedGain,
            delayedMaturity: result.delayedMaturity ?? null,
            costOfDelay: result.costOfDelay ?? null,
            schedule: result.schedule.filter(isYearRow),
          }}
        />
      ) : null}
      {mode === "stepup" &&
      result &&
      result.inflationAdjusted != null &&
      result.startMonthly != null &&
      result.endMonthly != null ? (
        <SipStepUpCalculatorDossier
          data={{
            clientName: name,
            age,
            email,
            phone,
            startMonthly: result.startMonthly,
            endMonthly: result.endMonthly,
            sipYears: stepYears,
            returnPct: stepReturn,
            stepUpPct,
            inflationPct: stepInflation,
            taxPct: stepTax,
            maturity: result.maturity,
            totalInvested: result.totalInvested,
            gain: result.gain,
            tax: result.tax,
            netAfterTax: result.netAfterTax,
            inflationAdjusted: result.inflationAdjusted,
            schedule: result.schedule.filter(isYearRow),
          }}
        />
      ) : null}
      {mode === "periodic" && result && result.payments != null ? (
        <PeriodicInvestmentDossier
          data={{
            clientName: name,
            age,
            email,
            phone,
            amount: periodicAmount,
            timesPerYear,
            frequencyLabel: frequencyLabel(timesPerYear),
            years: periodicYears,
            returnPct: periodicReturn,
            taxPct: periodicTax,
            maturity: result.maturity,
            totalInvested: result.totalInvested,
            gain: result.gain,
            tax: result.tax,
            netAfterTax: result.netAfterTax,
            payments: result.payments,
            schedule: result.schedule.filter((row): row is PeriodicRow => "contributionFv" in row),
          }}
        />
      ) : null}
    </>
  );
}

function isYearRow(row: YearRow | PeriodicRow): row is YearRow {
  return "year" in row && "yearEnd" in row;
}

function GrowthResults({
  mode,
  result,
  timesPerYear,
  horizonYears,
  delayMonths,
  openMilestones,
  onToggleMilestones,
  openAnalytics,
  onToggleAnalytics,
  openSchedule,
  onToggleSchedule,
}: {
  mode: Exclude<Mode, "lumpsum">;
  result: GrowthResult;
  timesPerYear: number;
  horizonYears: number;
  delayMonths: number;
  openMilestones: boolean;
  onToggleMilestones: () => void;
  openAnalytics: boolean;
  onToggleAnalytics: () => void;
  openSchedule: boolean;
  onToggleSchedule: () => void;
}) {
  const [chartTab, setChartTab] = useState<"growth" | "allocation">("growth");
  const yearRows = result.schedule.filter(isYearRow);
  const periodicRows = result.schedule.filter((row): row is PeriodicRow => "contributionFv" in row);
  const hasDelay =
    mode === "sip" &&
    delayMonths > 0 &&
    result.costOfDelay != null &&
    result.delayedMaturity != null;
  const realYieldPct =
    result.inflationAdjusted != null && result.totalInvested > 0
      ? ((result.inflationAdjusted - result.totalInvested) / result.totalInvested) * 100
      : null;

  const milestonesDescription =
    mode === "periodic"
      ? "Invested total, maturity, and net outcome after tax"
      : "Nominal maturity, purchasing power, and net outcome after tax";

  return (
    <div className="space-y-5">
      <WealthSection
        badge="02 · Milestones"
        title="Growth Milestones"
        subtitle={milestonesDescription}
        open={openMilestones}
        onToggle={onToggleMilestones}
        mark={
          <WealthIconMark tone="emerald">
            <IconChart />
          </WealthIconMark>
        }
        actions={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            Horizon: {horizonYears} Year{horizonYears === 1 ? "" : "s"}
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <WealthMetricCard
            title="Invested"
            value={result.totalInvested}
            description={
              mode === "stepup" && result.startMonthly != null && result.endMonthly != null
                ? "Step-up contribution path over the tenure"
                : mode === "periodic"
                  ? `${result.payments ?? 0} scheduled payments`
                  : result.payments != null
                    ? `${result.payments} SIP payments`
                    : "Total capital contributed"
            }
            badge={
              mode === "stepup"
                ? "Step-up path"
                : mode === "periodic"
                  ? `${result.payments ?? 0} payments`
                  : result.payments != null
                    ? `${result.payments} payments`
                    : undefined
            }
            tone="neutral"
            footer={
              mode === "stepup" && result.startMonthly != null && result.endMonthly != null ? (
                <>
                  SIP path ·{" "}
                  <span className="font-semibold tabular-nums text-slate-700">
                    {formatINRCurrency(result.startMonthly)} → {formatINRCurrency(result.endMonthly)}
                  </span>
                </>
              ) : mode === "periodic" ? (
                <>
                  Frequency ·{" "}
                  <span className="font-semibold text-slate-700">{frequencyLabel(timesPerYear)}</span>
                </>
              ) : (
                <>
                  Gain ·{" "}
                  <span className="font-semibold tabular-nums text-emerald-700">
                    {formatINRCurrency(result.gain)}
                  </span>
                </>
              )
            }
            mark={
              <WealthIconMark className="h-7 w-7">
                <IconSip className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title="Maturity"
            value={result.maturity}
            description="Nominal corpus at the end of the horizon"
            badge="Nominal"
            tone="positive"
            footer={
              result.inflationAdjusted != null ? (
                <>
                  Inflation-adj. ·{" "}
                  <span className="font-semibold tabular-nums text-slate-700">
                    {formatINRCurrency(result.inflationAdjusted)}
                    {realYieldPct != null ? ` · ${formatPercent(realYieldPct)}` : ""}
                  </span>
                </>
              ) : (
                <>
                  Gain ·{" "}
                  <span className="font-semibold tabular-nums text-emerald-700">
                    {formatINRCurrency(result.gain)}
                  </span>
                </>
              )
            }
            mark={
              <WealthIconMark tone="emerald" className="h-7 w-7">
                <IconChart className="h-3.5 w-3.5" />
              </WealthIconMark>
            }
          />
          <WealthMetricCard
            title={hasDelay ? "Cost of delay" : "Net after tax"}
            value={hasDelay ? (result.costOfDelay ?? 0) : result.netAfterTax}
            description={
              hasDelay
                ? `Opportunity cost from a ${delayMonths}-month late start`
                : "Corpus available after capital gains tax"
            }
            badge={hasDelay ? `${delayMonths} mo late` : "Post-tax"}
            tone={hasDelay ? "neutral" : "positive"}
            footer={
              hasDelay ? (
                <>
                  Delayed maturity ·{" "}
                  <span className="font-semibold tabular-nums text-slate-700">
                    {formatINRCurrency(result.delayedMaturity ?? 0)}
                  </span>
                </>
              ) : (
                <>
                  Tax ·{" "}
                  <span className="font-semibold tabular-nums text-rose-600">
                    {formatINRCurrency(result.tax)}
                  </span>
                </>
              )
            }
            mark={
              <WealthIconMark className="h-7 w-7" tone={hasDelay ? "amber" : "emerald"}>
                {hasDelay ? (
                  <IconDelay className="h-3.5 w-3.5" />
                ) : (
                  <IconTax className="h-3.5 w-3.5" />
                )}
              </WealthIconMark>
            }
          />
        </div>

        {hasDelay ? (
          <div className="mt-6 rounded-xl border border-dashed border-rose-300 bg-rose-50/70 p-4">
            <p className="text-xs font-semibold text-rose-800">Friction from delayed start</p>
            <p className="mt-1 text-[11px] leading-relaxed text-rose-700">
              Waiting {delayMonths} month{delayMonths === 1 ? "" : "s"} trims maturity to{" "}
              {formatINRCurrency(result.delayedMaturity ?? 0)}. Opportunity cost is{" "}
              {formatINRCurrency(result.costOfDelay ?? 0)} versus starting on time.
            </p>
          </div>
        ) : null}
      </WealthSection>

      <WealthSection
        badge="03 · Analytics"
        title="Growth Analytics"
        subtitle={
          mode === "periodic"
            ? "Contribution FV path and allocation mix"
            : "Corpus path and allocation mix"
        }
        open={openAnalytics}
        onToggle={onToggleAnalytics}
        mark={
          <WealthIconMark>
            <IconRates />
          </WealthIconMark>
        }
      >
        <div className="space-y-5">
          <div className="overflow-x-auto pb-1">
            <WealthSegmented
              layoutId={`growth-analytics-underline-${mode}`}
              variant="underline"
              value={chartTab}
              onChange={setChartTab}
              options={[
                {
                  id: "growth",
                  label: "Growth",
                  icon: <IconChart className="h-3.5 w-3.5" />,
                },
                {
                  id: "allocation",
                  label: "Corpus Mix",
                  icon: <IconDonut className="h-3.5 w-3.5" />,
                },
              ]}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={chartTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              {chartTab === "growth" ? (
                mode === "periodic" ? (
                  <WealthGrowthLine
                    data={periodicRows.map((row) => ({
                      year: row.month,
                      fv: row.contributionFv,
                      contribution: row.contribution,
                    }))}
                    xTick={(v) => `Month ${v}`}
                    series={[
                      {
                        key: "contribution",
                        label: "Contribution",
                        color: wealthChart.invested,
                        kind: "line",
                      },
                      {
                        key: "fv",
                        label: "FV at horizon",
                        color: wealthChart.stepUp,
                        kind: "area",
                      },
                    ]}
                  />
                ) : (
                  <WealthGrowthLine
                    data={yearRows.map((row) => ({
                      year: row.year,
                      invested: row.investedToDate,
                      corpus: row.yearEnd,
                      inflationAdjusted: row.inflationAdjusted ?? row.yearEnd,
                    }))}
                    series={[
                      {
                        key: "invested",
                        label: "Investment",
                        color: wealthChart.invested,
                        kind: "line",
                      },
                      {
                        key: "corpus",
                        label: "Full return",
                        color: wealthChart.stepUp,
                        kind: "area",
                      },
                      {
                        key: "inflationAdjusted",
                        label: "Inflation-adjusted",
                        color: wealthChart.inflAdj,
                        kind: "line",
                        dashed: true,
                      },
                    ]}
                  />
                )
              ) : (
                <WealthMixDonut
                  title={mode === "periodic" ? "Periodic mix" : "Corpus mix"}
                  centerValue={result.maturity}
                  centerLabel="Pre-tax"
                  tax={result.tax}
                  net={result.netAfterTax}
                  netLabel="Maturity"
                  slices={[
                    {
                      name: "Invested",
                      value: result.totalInvested,
                      color: wealthMixColors.invested,
                    },
                    {
                      name: "Gain",
                      value: result.gain,
                      color: wealthMixColors.gain,
                    },
                  ]}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </WealthSection>

      <WealthSection
        badge="04 · Audit"
        title={
          mode === "periodic"
            ? "Periodic Contribution Ledger"
            : mode === "stepup"
              ? "Step-Up SIP Outcome Ledger"
              : "SIP Outcome Ledger"
        }
        subtitle="Horizon, tax drag, yield, and line-by-line maturity audit"
        open={openSchedule}
        onToggle={onToggleSchedule}
        mark={
          <WealthIconMark>
            <IconCalendar />
          </WealthIconMark>
        }
      >
        <div className="space-y-5">
          <WealthAuditLedger
            stats={[
              {
                label: "Horizon",
                value: `${horizonYears} yr${horizonYears === 1 ? "" : "s"}`,
                hint:
                  mode === "periodic"
                    ? `${frequencyLabel(timesPerYear)} · ${result.payments ?? 0} payments`
                    : delayMonths > 0
                      ? `${delayMonths} mo start delay`
                      : mode === "stepup"
                        ? "Annual step-up path"
                        : "Monthly SIP path",
              },
              {
                label: "Net after tax",
                value: formatINRCurrency(result.netAfterTax),
                hint: `Gain ${formatINRCurrency(result.gain)} before tax`,
                tone: "emerald",
              },
              {
                label: "Post-tax yield",
                value:
                  result.totalInvested > 0
                    ? formatPercent(
                        ((result.netAfterTax - result.totalInvested) /
                          result.totalInvested) *
                          100,
                      )
                    : formatPercent(0),
                hint:
                  realYieldPct != null
                    ? `Inflation-adj. ${formatPercent(realYieldPct)}`
                    : "On invested capital",
              },
            ]}
            chips={
              <>
                <WealthAuditChip label="Tax drag">
                  {result.gain > 0
                    ? `${formatPercent((result.tax / result.gain) * 100, 1)} of pre-tax gain (${formatINRCurrency(result.tax)})`
                    : `${formatINRCurrency(result.tax)} on gains`}
                </WealthAuditChip>
                <WealthAuditChip label="Invested capital">
                  {formatINRCurrency(result.totalInvested)}
                  {result.payments != null ? ` · ${result.payments} payments` : ""}
                </WealthAuditChip>
              </>
            }
            columns={["Metric", "Amount"]}
            rows={[
              {
                label: "Total invested",
                cells: [{ text: formatINRCurrency(result.totalInvested) }],
              },
              {
                label: "Expected pre-tax return",
                cells: [{ text: formatINRCurrency(result.gain) }],
              },
              {
                label: "Tax on profit",
                cells: [{ text: formatINRCurrency(result.tax), tone: "rose" }],
                tax: true,
              },
              {
                label: "Post-tax return",
                cells: [
                  {
                    text: formatINRCurrency(result.netAfterTax - result.totalInvested),
                    tone: "emerald",
                  },
                ],
              },
              ...(result.inflationAdjusted != null
                ? [
                    {
                      label: "Inflation-adjusted corpus",
                      cells: [
                        {
                          text: formatINRCurrency(result.inflationAdjusted),
                          tone: "muted" as const,
                        },
                      ],
                    },
                  ]
                : []),
              {
                label: "Final maturity amount",
                cells: [
                  {
                    text: formatINRCurrency(result.maturity),
                    tone: "pill" as const,
                  },
                ],
                highlight: true,
              },
            ]}
            note={
              mode === "periodic"
                ? `Ledger uses the stated return and tax over ${horizonYears} year${horizonYears === 1 ? "" : "s"} of ${frequencyLabel(timesPerYear).toLowerCase()} contributions. Premature exit and market path risk are not modelled here.`
                : `Ledger uses the stated return, inflation, and tax over ${horizonYears} year${horizonYears === 1 ? "" : "s"}. Absolute yields are post-tax profit on invested capital. Market path risk is not modelled here.`
            }
          />

          {mode === "periodic" ? (
            <WealthDataTable
              rows={periodicRows}
              getRowKey={(row) => row.month}
              filterPlaceholder="Filter by month…"
              hideFilter={periodicRows.length <= 12}
              note="Each row is one scheduled contribution and the future value that payment would reach if held to the investment horizon."
              columns={[
                {
                  key: "month",
                  header: "Month",
                  align: "right",
                  sticky: true,
                  searchValue: (row) => String(row.month),
                  render: (row) => row.month,
                },
                {
                  key: "contribution",
                  header: "Contribution",
                  align: "right",
                  searchValue: (row) => String(row.contribution),
                  render: (row) => moneyCell(row.contribution),
                },
                {
                  key: "contributionFv",
                  header: "FV at horizon",
                  align: "right",
                  tone: "emerald",
                  searchValue: (row) => String(row.contributionFv),
                  render: (row) => moneyCell(row.contributionFv),
                },
              ]}
            />
          ) : (
            <WealthDataTable
              rows={yearRows}
              getRowKey={(row) => row.year}
              filterPlaceholder="Filter by year…"
              note="Year-end corpus, invested capital to date, and inflation-adjusted purchasing power for each year of the horizon."
              columns={[
                {
                  key: "year",
                  header: "Year",
                  sticky: true,
                  searchValue: (row) => String(row.year),
                  render: (row) => row.year,
                },
                {
                  key: "monthly",
                  header: "Monthly SIP",
                  align: "right",
                  searchValue: (row) => String(row.monthly),
                  render: (row) => moneyCell(row.monthly),
                },
                {
                  key: "investedToDate",
                  header: "Invested",
                  align: "right",
                  searchValue: (row) => String(row.investedToDate),
                  render: (row) => moneyCell(row.investedToDate),
                },
                {
                  key: "yearEnd",
                  header: "Year-end",
                  align: "right",
                  tone: "emerald",
                  searchValue: (row) => String(row.yearEnd),
                  render: (row) => moneyCell(row.yearEnd),
                },
                {
                  key: "inflationAdjusted",
                  header: "Inflation-adj.",
                  align: "right",
                  searchValue: (row) => String(row.inflationAdjusted ?? ""),
                  render: (row) =>
                    row.inflationAdjusted != null
                      ? moneyCell(row.inflationAdjusted)
                      : "—",
                },
              ]}
            />
          )}
        </div>
      </WealthSection>
    </div>
  );
}
