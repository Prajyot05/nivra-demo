"use client";

import { useMemo, useState } from "react";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import {
  AgeInput,
  BentoGroup,
  BentoSection,
  ChartPane,
  ClientProfileBar,
  ComplianceFootnote,
  CompositionChart,
  Field,
  formatINRCurrency,
  formatPercent,
  GrowthChart,
  MoneyInput,
  PercentInput,
  ResultsSection,
  ScheduleTable,
  SelectInput,
  SegmentedChartControl,
  Stack,
  StatCard,
  StatGrid,
  StatusNote,
  TextInput,
  YearInput,
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
import { LineChart, PieChart } from "lucide-react";

const MODES = [
  { id: "sip", label: "SIP" },
  { id: "stepup", label: "Step-up" },
  { id: "lumpsum", label: "Lumpsum" },
  { id: "periodic", label: "Periodic" },
] as const;

type Mode = (typeof MODES)[number]["id"];
const MODE_IDS = MODES.map((m) => m.id);

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
      "Interactive multi-parameter engine for monthly SIP growth with inflation and delay",
  },
  stepup: {
    strategy: "Step-up SIP compounding",
    goal: "Rising contribution growth",
    description: "Annual step-up SIP with inflation and tax impact.",
    assumptionsBlurb:
      "Interactive multi-parameter engine for step-up SIP growth with inflation",
  },
  periodic: {
    strategy: "Periodic contribution compounding",
    goal: "Scheduled investing",
    description: "Fixed contributions at a chosen frequency through the tenure.",
    assumptionsBlurb:
      "Interactive multi-parameter engine for periodic contribution growth and tax",
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

export function InvestmentGrowth() {
  const [mode] = useCalculatorMode(MODE_IDS, "lumpsum");
  if (mode === "lumpsum") {
    return <GrowthLumpsum />;
  }

  return <InvestmentGrowthModes mode={mode} />;
}

function InvestmentGrowthModes({ mode }: { mode: Exclude<Mode, "lumpsum"> }) {
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
  const endAge = age + horizonYears;

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

  const meta = MODE_META[mode];

  return (
    <>
      <CalculatorPage
        title={getCalculatorPageTitle("/growth", mode)}
        description={meta.description}
        actions={
          <ReportDownloadButton
            onClick={handleDownload}
            disabled={!result}
            loading={isDownloading}
          />
        }
        header={
          <ClientProfileBar
            name={name}
            age={age}
            email={email}
            phone={phone}
            strategy={meta.strategy}
            goal={meta.goal}
          />
        }
        form={
          <BentoSection
            sectionId="01"
            title="Financial Assumptions & Modeling Suite"
            description={meta.assumptionsBlurb}
            collapsible
            open={openAssumptions}
            onToggle={() => setOpenAssumptions((v) => !v)}
            actions={
              <button
                type="button"
                onClick={resetDefaults}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-emerald-700"
              >
                Reset to Baseline
              </button>
            }
          >
            <BentoGroup
              num="01"
              title="Investor Profile"
              colSpan={4}
              footer={
                <>
                  <span>Age path:</span>
                  <span className="font-bold text-slate-700">
                    {age} → {endAge}
                  </span>
                </>
              }
            >
              <div className="mb-4">
                <Field label="Client Name" error={clientNameError}>
                  <TextInput
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={clientNameError ? "border-[var(--app-danger)]" : undefined}
                  />
                </Field>
              </div>
              <div className="mb-4">
                <AgeInput value={age} onChange={setAge} error={clientAgeError} />
              </div>
              <div className="mb-4">
                <Field label="Email" error={clientEmailError}>
                  <TextInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@email.com"
                    className={clientEmailError ? "border-[var(--app-danger)]" : undefined}
                  />
                </Field>
              </div>
              <Field label="Phone" error={clientPhoneError}>
                <TextInput
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={clientPhoneError ? "border-[var(--app-danger)]" : undefined}
                />
              </Field>
            </BentoGroup>

            {mode === "sip" ? (
              <>
                <BentoGroup
                  num="02"
                  title="Investment Parameters"
                  colSpan={5}
                  footer={
                    <>
                      <span>Horizon:</span>
                      <span className="font-bold text-emerald-700">
                        {investYears} yr{investYears === 1 ? "" : "s"} SIP · {sipYears} yr
                        {sipYears === 1 ? "" : "s"} contribute
                        {sipDelay > 0 ? ` · ${sipDelay} mo delay` : ""}
                      </span>
                    </>
                  }
                >
                  <div className="mb-4">
                    <MoneyInput
                      label="Monthly SIP"
                      value={sipMonthly}
                      onChange={setSipMonthly}
                      error={sipMonthlyError}
                    />
                  </div>
                  <div className="mb-4">
                    <YearInput
                      label="SIP years"
                      value={sipYears}
                      min={1}
                      max={100}
                      onChange={setSipYears}
                      error={sipYearsError ?? (sipYears > investYears ? sipHorizonError : undefined)}
                    />
                  </div>
                  <div className="mb-4">
                    <YearInput
                      label="Horizon"
                      value={investYears}
                      min={1}
                      max={100}
                      suffix="Years"
                      onChange={setInvestYears}
                      error={sipHorizonError}
                    />
                  </div>
                  <YearInput
                    label="Delay"
                    value={sipDelay}
                    min={0}
                    max={1200}
                    suffix="Months"
                    onChange={(v) => setSipDelay(Math.max(0, v))}
                    error={sipDelayError}
                  />
                </BentoGroup>

                <BentoGroup
                  num="03"
                  title="Rate Assumptions"
                  subtitle="Return, Inflation & Tax"
                  colSpan={3}
                  footer={
                    <>
                      <span>Tax drag:</span>
                      <span className="font-bold text-emerald-700">{formatPercent(sipTax)}</span>
                    </>
                  }
                >
                  <div className="mb-3.5">
                    <PercentInput
                      label="Return"
                      value={sipReturn}
                      onChange={(v) => setSipReturn(Math.max(0, v))}
                      error={sipReturnError}
                    />
                  </div>
                  <div className="mb-3.5">
                    <PercentInput
                      label="Inflation"
                      value={sipInflation}
                      onChange={(v) => setSipInflation(Math.max(0, v))}
                      error={sipInflationError}
                    />
                  </div>
                  <PercentInput
                    label="Tax"
                    value={sipTax}
                    onChange={(v) => setSipTax(Math.max(0, v))}
                    error={sipTaxError}
                  />
                </BentoGroup>
              </>
            ) : mode === "stepup" ? (
              <>
                <BentoGroup
                  num="02"
                  title="Investment Parameters"
                  colSpan={5}
                  footer={
                    <>
                      <span>Horizon:</span>
                      <span className="font-bold text-emerald-700">
                        {stepYears} yr{stepYears === 1 ? "" : "s"} · {formatPercent(stepUpPct)}{" "}
                        step-up
                      </span>
                    </>
                  }
                >
                  <div className="mb-4">
                    <MoneyInput
                      label="Start SIP"
                      value={stepStart}
                      onChange={setStepStart}
                      error={stepStartError}
                    />
                  </div>
                  <div className="mb-4">
                    <YearInput
                      label="SIP years"
                      value={stepYears}
                      min={1}
                      max={100}
                      onChange={setStepYears}
                      error={stepYearsError}
                    />
                  </div>
                  <PercentInput
                    label="Step-up"
                    value={stepUpPct}
                    onChange={(v) => setStepUpPct(Math.max(0, v))}
                    error={stepUpPctError}
                  />
                </BentoGroup>

                <BentoGroup
                  num="03"
                  title="Rate Assumptions"
                  subtitle="Return, Inflation & Tax"
                  colSpan={3}
                  footer={
                    <>
                      <span>Tax drag:</span>
                      <span className="font-bold text-emerald-700">{formatPercent(stepTax)}</span>
                    </>
                  }
                >
                  <div className="mb-3.5">
                    <PercentInput
                      label="Return"
                      value={stepReturn}
                      onChange={(v) => setStepReturn(Math.max(0, v))}
                      error={stepReturnError}
                    />
                  </div>
                  <div className="mb-3.5">
                    <PercentInput
                      label="Inflation"
                      value={stepInflation}
                      onChange={(v) => setStepInflation(Math.max(0, v))}
                      error={stepInflationError}
                    />
                  </div>
                  <PercentInput
                    label="Tax"
                    value={stepTax}
                    onChange={(v) => setStepTax(Math.max(0, v))}
                    error={stepTaxError}
                  />
                </BentoGroup>
              </>
            ) : (
              <>
                <BentoGroup
                  num="02"
                  title="Investment Parameters"
                  colSpan={5}
                  footer={
                    <>
                      <span>Schedule:</span>
                      <span className="font-bold text-emerald-700">
                        {frequencyLabel(timesPerYear)} · {periodicYears} yr
                        {periodicYears === 1 ? "" : "s"}
                      </span>
                    </>
                  }
                >
                  <div className="mb-4">
                    <MoneyInput
                      label="Amount each"
                      value={periodicAmount}
                      onChange={setPeriodicAmount}
                      error={periodicAmountError}
                    />
                  </div>
                  <div className="mb-4">
                    <SelectInput
                      label="Freq / yr"
                      value={String(timesPerYear)}
                      onChange={(value) => setTimesPerYear(Number(value))}
                      options={FREQUENCY_OPTIONS}
                      hint={frequencyHint(timesPerYear)}
                      className="min-w-0 text-[13px]"
                    />
                  </div>
                  <YearInput
                    label="Tenure"
                    value={periodicYears}
                    min={1}
                    max={50}
                    suffix="Years"
                    onChange={setPeriodicYears}
                    error={periodicYearsError}
                  />
                </BentoGroup>

                <BentoGroup
                  num="03"
                  title="Rate Assumptions"
                  subtitle="Return & Tax"
                  colSpan={3}
                  footer={
                    <>
                      <span>Tax drag:</span>
                      <span className="font-bold text-emerald-700">
                        {formatPercent(periodicTax)}
                      </span>
                    </>
                  }
                >
                  <div className="mb-3.5">
                    <PercentInput
                      label="Return"
                      value={periodicReturn}
                      onChange={(v) => setPeriodicReturn(Math.max(0, v))}
                      error={periodicReturnError}
                    />
                  </div>
                  <PercentInput
                    label="Tax"
                    value={periodicTax}
                    onChange={(v) => setPeriodicTax(Math.max(0, v))}
                    error={periodicTaxError}
                  />
                </BentoGroup>
              </>
            )}
          </BentoSection>
        }
        results={
          <>
            {error ? <StatusNote tone="error">{error}</StatusNote> : null}
            {!canCalculate ? (
              <StatusNote tone="error">
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
              </StatusNote>
            ) : null}
            {loading && !result && canCalculate ? (
              <StatusNote tone="pending">Calculating…</StatusNote>
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
              />
            ) : null}
          </>
        }
        footer={
          <ComplianceFootnote>
            {mode === "sip" ? (
              <>
                Calculations shown are for illustration purposes only. SIP projections compound as
                modeled with the stated return, inflation, and tax assumptions. Delay shortens the
                compounding runway. Market investments are subject to risk; past performance does
                not guarantee future results.
              </>
            ) : mode === "stepup" ? (
              <>
                Calculations shown are for illustration purposes only. Step-up SIP projections
                increase contributions annually at the stated rate. Tax treatment depends on the
                investor&apos;s applicable rules. Market investments are subject to risk; past
                performance does not guarantee future results.
              </>
            ) : (
              <>
                Calculations shown are for illustration purposes only. Periodic contribution
                projections apply the stated return and tax assumptions to each scheduled payment.
                Market investments are subject to risk; past performance does not guarantee future
                results.
              </>
            )}
          </ComplianceFootnote>
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

function mixSlices(result: GrowthResult) {
  return [
    { name: "Invested", value: result.totalInvested, color: "var(--app-chart-invested)" },
    { name: "Gain", value: result.gain, color: "var(--app-chart-gain)" },
    { name: "Tax", value: result.tax, color: "var(--app-chart-tax)" },
  ];
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
}) {
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
    <Stack>
      <ResultsSection
        sectionId="02"
        title="Growth Milestones"
        description={milestonesDescription}
        open={openMilestones}
        onToggle={onToggleMilestones}
        meta={
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            Horizon: {horizonYears} Year{horizonYears === 1 ? "" : "s"}
          </span>
        }
      >
        <StatGrid>
          <StatCard
            title="Invested"
            value={result.totalInvested}
            tone="neutral"
            badge={
              mode === "stepup" && result.startMonthly != null && result.endMonthly != null ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  Step-up path
                </span>
              ) : mode === "periodic" ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {result.payments ?? 0} payments
                </span>
              ) : result.payments != null ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {result.payments} payments
                </span>
              ) : undefined
            }
            footer={
              mode === "stepup" && result.startMonthly != null && result.endMonthly != null ? (
                <div className="flex items-center justify-between">
                  <span>SIP path:</span>
                  <span className="font-semibold text-slate-700">
                    {formatINRCurrency(result.startMonthly)} → {formatINRCurrency(result.endMonthly)}
                  </span>
                </div>
              ) : mode === "periodic" ? (
                <div className="flex items-center justify-between">
                  <span>Frequency:</span>
                  <span className="font-semibold text-slate-700">
                    {frequencyLabel(timesPerYear)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span>Gain:</span>
                  <span className="font-bold text-emerald-700">
                    {formatINRCurrency(result.gain)}
                  </span>
                </div>
              )
            }
          />
          <StatCard
            title="Maturity"
            value={result.maturity}
            tone="positive"
            badge={
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Nominal
              </span>
            }
            footer={
              result.inflationAdjusted != null ? (
                <div className="flex items-center justify-between">
                  <span>Inflation-adj.:</span>
                  <span className="font-semibold text-slate-700">
                    {formatINRCurrency(result.inflationAdjusted)}
                    {realYieldPct != null ? ` · ${formatPercent(realYieldPct)}` : ""}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span>Gain:</span>
                  <span className="font-bold text-emerald-700">
                    {formatINRCurrency(result.gain)}
                  </span>
                </div>
              )
            }
          />
          <StatCard
            title={hasDelay ? "Cost of delay" : "Net after tax"}
            value={hasDelay ? (result.costOfDelay ?? 0) : result.netAfterTax}
            tone={hasDelay ? "negative" : "positive"}
            badge={
              hasDelay ? (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                  {delayMonths} mo late
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Post-tax
                </span>
              )
            }
            footer={
              hasDelay ? (
                <div className="flex items-center justify-between">
                  <span>Delayed maturity:</span>
                  <span className="font-semibold text-slate-700">
                    {formatINRCurrency(result.delayedMaturity ?? 0)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span>Tax:</span>
                  <span className="font-semibold text-rose-600">
                    {formatINRCurrency(result.tax)}
                  </span>
                </div>
              )
            }
          />
        </StatGrid>

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
      </ResultsSection>

      <ResultsSection
        sectionId="03"
        title="Growth Analytics"
        description={
          mode === "periodic"
            ? "Contribution FV path, allocation mix, and contribution schedule"
            : "Corpus path, allocation mix, and yearly audit ledger"
        }
        open={openAnalytics}
        onToggle={onToggleAnalytics}
      >
        <SegmentedChartControl
          variant="pill"
          tabs={[
            {
              id: "growth",
              label: "Growth",
              icon: <LineChart className="h-3.5 w-3.5" />,
              content: (
                <ChartPane>
                  {mode === "periodic" ? (
                    <GrowthChart
                      title="FV of each contribution"
                      showEndLabels
                      markers
                      endLabelFull
                      xTickFormatter={(month) => `Month ${month}`}
                      data={periodicRows.map((row) => ({
                        year: row.month,
                        fv: row.contributionFv,
                        contribution: row.contribution,
                      }))}
                      series={[
                        { key: "fv", label: "FV at horizon", color: "var(--app-chart-gain)" },
                        {
                          key: "contribution",
                          label: "Contribution",
                          color: "var(--app-chart-invested)",
                        },
                      ]}
                    />
                  ) : (
                    <GrowthChart
                      title="Investment vs corpus"
                      showEndLabels
                      endpointDots
                      strokeWidth={4}
                      data={yearRows.map((row) => ({
                        year: row.year,
                        invested: row.investedToDate,
                        corpus: row.yearEnd,
                        inflationAdjusted: row.inflationAdjusted ?? row.yearEnd,
                      }))}
                      series={[
                        { key: "invested", label: "Investment", color: "var(--app-chart-invested)" },
                        { key: "corpus", label: "Full return", color: "var(--app-chart-gain)" },
                        {
                          key: "inflationAdjusted",
                          label: "Inflation-adjusted",
                          color: "var(--app-chart-inflation)",
                        },
                      ]}
                    />
                  )}
                </ChartPane>
              ),
            },
            {
              id: "allocation",
              label: "Allocation",
              icon: <PieChart className="h-3.5 w-3.5" />,
              content: (
                <ChartPane>
                  <CompositionChart
                    title={mode === "periodic" ? "Periodic mix" : "Invested / gain / tax"}
                    showPercentages
                    size="lg"
                    slices={mixSlices(result)}
                    centerLabel="Maturity"
                    centerValue={result.maturity}
                  />
                </ChartPane>
              ),
            },
          ]}
        />

        <div className="mt-8">
          {mode === "periodic" ? (
            <ScheduleTable
              caption="Contribution schedule"
              meta={`${periodicRows.length} contributions`}
              zebra
              columns={[
                { key: "month", header: "Month", align: "right", sticky: true },
                {
                  key: "contribution",
                  header: "Contribution",
                  format: "inr",
                  align: "right",
                  tone: "std",
                },
                {
                  key: "contributionFv",
                  header: "FV at horizon",
                  format: "inr",
                  align: "right",
                  tone: "step",
                },
              ]}
              rows={periodicRows}
            />
          ) : (
            <ScheduleTable
              caption="Yearly schedule"
              meta={`${yearRows.length} years`}
              zebra
              columns={[
                { key: "year", header: "Year", sticky: true },
                {
                  key: "monthly",
                  header: "Monthly SIP",
                  format: "inr",
                  align: "right",
                  tone: "std",
                },
                {
                  key: "investedToDate",
                  header: "Invested",
                  format: "inr",
                  align: "right",
                  tone: "std",
                },
                {
                  key: "yearEnd",
                  header: "Year-end",
                  format: "inr",
                  align: "right",
                  tone: "step",
                },
                {
                  key: "inflationAdjusted",
                  header: "Inflation-adj.",
                  format: "inr",
                  align: "right",
                  tone: "std",
                },
              ]}
              rows={yearRows}
            />
          )}
        </div>
      </ResultsSection>
    </Stack>
  );
}
