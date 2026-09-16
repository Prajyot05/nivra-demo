"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AgeInput,
  BentoGroup,
  BentoSection,
  Card,
  CHIP,
  CHIP_OFF,
  CHIP_ON,
  ClientProfileBar,
  ResultsSection,
  CompareChart,
  CompositionChart,
  ComplianceFootnote,
  Field,
  formatINRCurrency,
  formatPercent,
  GrowthChart,
  MoneyInput,
  PercentInput,
  ScheduleTable,
  SectionTitle,
  SegmentedChartControl,
  Stack,
  StatCard,
  StatGrid,
  StatusNote,
  TextInput,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import {
  OneTimeInvestmentDossier,
  ONE_TIME_INVESTMENT_REPORT_ID,
} from "@/components/reports/one-time-investment-dossier";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import { useCalculate } from "@/hooks/use-calculate";
import { getCalculatorPageTitle } from "@/lib/calculator-nav";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import { BarChart3, ChevronDown, LineChart, PieChart } from "lucide-react";

const AMOUNT_MIN = 10_000;
const AMOUNT_MAX = 100_00_00_000; // ₹100 Cr
const AMOUNT_STEP = 1_00_000;
const AMOUNT_PRESETS = [
  { label: "₹1L", value: 1_00_000 },
  { label: "₹10L", value: 10_00_000 },
  { label: "₹50L", value: 50_00_000 },
  { label: "₹1Cr", value: 1_00_00_000 },
  { label: "₹10Cr", value: 10_00_00_000 },
  { label: "₹50Cr", value: 50_00_00_000 },
  { label: "₹100Cr", value: 100_00_00_000 },
] as const;

const YEAR_PRESETS = [5, 10, 15, 16, 20, 25, 30] as const;
const DELAY_PRESETS = [0, 3, 6, 12, 18, 24] as const;

type YearRow = {
  year: number;
  monthly: number;
  investedToDate: number;
  yearEnd: number;
  inflationAdjusted?: number;
};

type LumpsumResult = {
  maturity: number;
  totalInvested: number;
  gain: number;
  tax: number;
  netAfterTax: number;
  inflationAdjusted: number;
  inflationAdjustedGain?: number;
  delayedMaturity?: number | null;
  costOfDelay?: number | null;
  schedule: YearRow[];
};

function nameError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Client name is required.";
  if (trimmed.length < 2) return "Enter at least 2 characters.";
  if (trimmed.length > 80) return "Name is too long (max 80 characters).";
  return undefined;
}

function ageError(value: number): string | undefined {
  if (!Number.isFinite(value)) return "Age must be a valid number.";
  if (value < 18) return "Age must be at least 18 years.";
  if (value > 100) return "Age cannot exceed 100 years.";
  return undefined;
}

function emailError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  if (trimmed.length > 120) return "Email is too long.";
  return undefined;
}

function phoneError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Phone number is required.";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10) return "Enter a valid 10-digit phone number.";
  if (digits.length > 12) return "Phone number is too long.";
  return undefined;
}

function amountErrorMsg(value: number, max: number): string | undefined {
  if (!Number.isFinite(value)) return "Investment amount must be a valid number.";
  if (value <= 0) return "Investment amount is required.";
  if (value < 1) return "Amount must be at least ₹1.";
  if (value > max) return `Amount cannot exceed ₹${max.toLocaleString("en-IN")}.`;
  return undefined;
}

function rateError(value: number, label: string): string | undefined {
  if (!Number.isFinite(value)) return `${label} must be a valid number.`;
  if (value < 0) return `${label} cannot be negative.`;
  if (value > 100) return `${label} cannot exceed 100%.`;
  return undefined;
}

function AuditBreakdownTable({
  result,
  delayMonths,
}: {
  result: LumpsumResult;
  delayMonths: number;
}) {
  const rows: Array<{
    label: string;
    value: number;
    tax?: boolean;
    highlight?: boolean;
  }> = [
    { label: "Principal invested", value: result.totalInvested },
    { label: "Pre-tax maturity", value: result.maturity, highlight: true },
    { label: "Investment gain", value: result.gain },
    { label: "Inflation-adjusted corpus", value: result.inflationAdjusted },
    {
      label: "Inflation-adjusted gain",
      value: result.inflationAdjustedGain ?? result.inflationAdjusted - result.totalInvested,
    },
    { label: "Tax on gains", value: result.tax, tax: true },
    { label: "Net after tax", value: result.netAfterTax, highlight: true },
  ];

  if (delayMonths > 0 && result.delayedMaturity != null && result.costOfDelay != null) {
    rows.push(
      { label: "Delayed maturity", value: result.delayedMaturity },
      { label: "Cost of delay", value: result.costOfDelay, tax: true },
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Audit Breakdown</h3>
          <p className="text-[11px] text-slate-500">
            Nominal growth, purchasing power, tax, and delay impact
          </p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[420px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-800 text-[11px] uppercase tracking-wider text-white">
              <th className="px-4 py-3 font-semibold">Metric</th>
              <th className="px-4 py-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className={`border-t border-slate-100 ${
                  row.highlight ? "bg-emerald-50/60" : "bg-white"
                }`}
              >
                <td className="px-4 py-2.5 text-slate-700">{row.label}</td>
                <td
                  className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                    row.tax
                      ? "text-rose-600"
                      : row.highlight
                        ? "text-emerald-800"
                        : "text-slate-800"
                  }`}
                >
                  {formatINRCurrency(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GrowthLumpsum() {
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(30);
  const [email, setEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [phone, setPhone] = useState(DUMMY_REPORT_CONTACT.phone);
  const [amount, setAmount] = useState(5_000_000);
  const [years, setYears] = useState(16);
  const [returnPct, setReturnPct] = useState(12);
  const [inflationPct, setInflationPct] = useState(5.75);
  const [delayMonths, setDelayMonths] = useState(6);
  const [taxPct, setTaxPct] = useState(0);

  const [openAssumptions, setOpenAssumptions] = useState(true);
  const [openMilestones, setOpenMilestones] = useState(true);
  const [openAnalytics, setOpenAnalytics] = useState(true);

  const clientNameError = nameError(name);
  const clientAgeError = ageError(age);
  const clientEmailError = emailError(email);
  const clientPhoneError = phoneError(phone);
  const amountError = amountErrorMsg(amount, AMOUNT_MAX);
  const yearsError =
    !Number.isFinite(years) || years < 1
      ? "Tenure must be at least 1 year."
      : years > 100
        ? "Tenure cannot exceed 100 years."
        : undefined;
  const returnError = rateError(returnPct, "Expected return");
  const inflationError = rateError(inflationPct, "Inflation");
  const taxError = rateError(taxPct, "Tax");
  const delayError =
    !Number.isFinite(delayMonths) || delayMonths < 0
      ? "Delay cannot be negative."
      : delayMonths > years * 12
        ? "Delay cannot exceed the investment tenure."
        : undefined;

  const fieldErrors = [
    clientNameError,
    clientAgeError,
    clientEmailError,
    clientPhoneError,
    amountError,
    yearsError,
    returnError,
    inflationError,
    delayError,
    taxError,
  ].filter((msg): msg is string => Boolean(msg));

  const canCalculate = fieldErrors.length === 0;

  const input = useMemo(
    () => ({
      clientName: name,
      age,
      amount,
      years,
      returnPct,
      inflationPct,
      delayMonths: Math.max(0, Math.round(delayMonths)),
      taxPct,
    }),
    [name, age, amount, years, returnPct, inflationPct, delayMonths, taxPct],
  );

  const { result, error, loading } = useCalculate<LumpsumResult>(
    "growth-lumpsum",
    input,
    canCalculate,
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const endAge = age + years;
  const realYieldPct =
    result && result.totalInvested > 0
      ? ((result.inflationAdjusted - result.totalInvested) / result.totalInvested) * 100
      : 0;
  const hasDelay =
    delayMonths > 0 &&
    result != null &&
    result.costOfDelay != null &&
    result.delayedMaturity != null;

  const resetDefaults = () => {
    setName("Mr. Anshu Kaul");
    setAge(30);
    setEmail(DUMMY_REPORT_CONTACT.email);
    setPhone(DUMMY_REPORT_CONTACT.phone);
    setAmount(5_000_000);
    setYears(16);
    setReturnPct(12);
    setInflationPct(5.75);
    setDelayMonths(6);
    setTaxPct(0);
  };

  const handleDownload = async () => {
    if (!result || isDownloading) return;
    setIsDownloading(true);
    try {
      const safe = (name || "client")
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      await generatePdfFromElement(
        ONE_TIME_INVESTMENT_REPORT_ID,
        `one-time-investment-${safe || "report"}`,
      );
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const yearRows = result?.schedule ?? [];

  return (
    <>
      <CalculatorPage
        title={getCalculatorPageTitle("/growth", "lumpsum")}
        description="One-time lumpsum compounding with inflation, tax, and cost of delay."
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
            strategy="One-time lumpsum compounding"
            goal="Capital growth"
          />
        }
        form={
          <BentoSection
            sectionId="01"
            title="Financial Assumptions & Modeling Suite"
            description="Interactive multi-parameter engine for one-time investment growth with inflation and delay"
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

            <BentoGroup
              num="02"
              title="Investment Parameters"
              colSpan={5}
              footer={
                <>
                  <span>Horizon:</span>
                  <span className="font-bold text-emerald-700">
                    {years} yr{years === 1 ? "" : "s"}
                    {delayMonths > 0 ? ` · ${delayMonths} mo delay` : ""}
                  </span>
                </>
              }
            >
              <div className="mb-4">
                <MoneyInput
                  label="Investment amount"
                  value={amount}
                  onChange={(v) => setAmount(Math.min(AMOUNT_MAX, Math.max(0, v)))}
                  error={amountError}
                  max={AMOUNT_MAX}
                  suffix="₹"
                />
                <input
                  type="range"
                  className="nivra-range-slider mt-3 w-full cursor-pointer"
                  min={AMOUNT_MIN}
                  max={AMOUNT_MAX}
                  step={AMOUNT_STEP}
                  value={Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, amount || AMOUNT_MIN))}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  aria-label="Investment amount slider"
                />
                <div className="mt-1 flex items-center justify-between text-[10px] font-semibold tabular-nums text-slate-400">
                  <span>{formatINRCurrency(AMOUNT_MIN)}</span>
                  <span>{formatINRCurrency(AMOUNT_MAX)}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Quick:</span>
                  {AMOUNT_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setAmount(preset.value)}
                      aria-pressed={amount === preset.value}
                      className={`${CHIP} ${amount === preset.value ? CHIP_ON : CHIP_OFF}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <YearInput
                  label="Term"
                  value={years}
                  min={1}
                  max={100}
                  suffix="Years"
                  onChange={setYears}
                  error={yearsError}
                />
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Quick:</span>
                  {YEAR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setYears(preset)}
                      aria-pressed={years === preset}
                      className={`${CHIP} ${years === preset ? CHIP_ON : CHIP_OFF}`}
                    >
                      {preset}Y
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <YearInput
                  label="Delay"
                  value={delayMonths}
                  min={0}
                  max={1200}
                  suffix="Months"
                  onChange={(v) => setDelayMonths(Math.max(0, v))}
                  error={delayError}
                />
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Quick:</span>
                  {DELAY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDelayMonths(preset)}
                      aria-pressed={delayMonths === preset}
                      className={`${CHIP} ${delayMonths === preset ? CHIP_ON : CHIP_OFF}`}
                    >
                      {preset === 0 ? "None" : `${preset}M`}
                    </button>
                  ))}
                </div>
              </div>
            </BentoGroup>

            <BentoGroup
              num="03"
              title="Rate Assumptions"
              subtitle="Return, Inflation & Tax"
              colSpan={3}
              footer={
                <>
                  <span>Tax drag:</span>
                  <span className="font-bold text-emerald-700">{formatPercent(taxPct)}</span>
                </>
              }
            >
              <div className="mb-3.5">
                <PercentInput
                  label="Expected return"
                  value={returnPct}
                  onChange={(v) => setReturnPct(Math.max(0, v))}
                  error={returnError}
                />
              </div>
              <div className="mb-3.5">
                <PercentInput
                  label="Inflation"
                  value={inflationPct}
                  onChange={(v) => setInflationPct(Math.max(0, v))}
                  error={inflationError}
                />
              </div>
              <PercentInput
                label="Tax"
                value={taxPct}
                onChange={(v) => setTaxPct(Math.max(0, v))}
                error={taxError}
              />
            </BentoGroup>
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
              <Stack>
                <ResultsSection
                  sectionId="02"
                  title="Growth Milestones"
                  description="Nominal maturity, purchasing power, and net outcome after tax"
                  open={openMilestones}
                  onToggle={() => setOpenMilestones((v) => !v)}
                  meta={
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      Horizon: {years} Years
                    </span>
                  }
                >
                  <StatGrid>
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
                        <div className="flex items-center justify-between">
                          <span>Invested:</span>
                          <span className="font-bold text-emerald-700">
                            {formatINRCurrency(result.totalInvested)}
                          </span>
                        </div>
                      }
                    />
                    <StatCard
                      title="Inflation adjusted"
                      value={result.inflationAdjusted}
                      tone="neutral"
                      badge={
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Today rupees
                        </span>
                      }
                      footer={
                        <div className="flex items-center justify-between">
                          <span>Real yield:</span>
                          <span className="font-semibold text-slate-700">
                            {formatPercent(realYieldPct)}
                          </span>
                        </div>
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
                            <span>Gain after tax:</span>
                            <span className="font-bold text-emerald-700">
                              {formatINRCurrency(result.gain - result.tax)}
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
                  description="Corpus path, allocation mix, delay compare, and yearly audit ledger"
                  open={openAnalytics}
                  onToggle={() => setOpenAnalytics((v) => !v)}
                >
                  <SegmentedChartControl
                    variant="pill"
                    tabs={[
                      {
                        id: "growth",
                        label: "Growth",
                        icon: <LineChart className="h-3.5 w-3.5" />,
                        content: (
                          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] sm:p-8">
                            <GrowthChart
                              title="Full return vs inflation-adjusted"
                              showEndLabels
                              endpointDots
                              data={yearRows.map((row) => ({
                                year: row.year,
                                corpus: row.yearEnd,
                                inflationAdjusted: row.inflationAdjusted ?? row.yearEnd,
                              }))}
                              series={[
                                {
                                  key: "corpus",
                                  label: "Full return",
                                  color: "var(--app-chart-gain)",
                                },
                                {
                                  key: "inflationAdjusted",
                                  label: "Inflation-adjusted",
                                  color: "var(--app-chart-inflation)",
                                },
                              ]}
                            />
                          </div>
                        ),
                      },
                      {
                        id: "allocation",
                        label: "Allocation",
                        icon: <PieChart className="h-3.5 w-3.5" />,
                        content: (
                          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] sm:p-8">
                            <CompositionChart
                              title="Invested / gain / tax"
                              showPercentages
                              size="lg"
                              slices={[
                                {
                                  name: "Invested",
                                  value: result.totalInvested,
                                  color: "var(--app-chart-invested)",
                                },
                                {
                                  name: "Gain",
                                  value: result.gain,
                                  color: "var(--app-chart-gain)",
                                },
                                {
                                  name: "Tax",
                                  value: result.tax,
                                  color: "var(--app-chart-tax)",
                                },
                              ]}
                              centerLabel="Maturity"
                              centerValue={result.maturity}
                            />
                          </div>
                        ),
                      },
                      ...(hasDelay
                        ? [
                            {
                              id: "delay",
                              label: "Delay",
                              icon: <BarChart3 className="h-3.5 w-3.5" />,
                              content: (
                                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] sm:p-8">
                                  <CompareChart
                                    title="On-time vs delayed maturity"
                                    showBarLabels
                                    data={[
                                      {
                                        category: "Maturity",
                                        onTime: result.maturity,
                                        delayed: result.delayedMaturity ?? 0,
                                      },
                                    ]}
                                    series={[
                                      {
                                        key: "onTime",
                                        label: "On time",
                                        color: "#00875a",
                                      },
                                      {
                                        key: "delayed",
                                        label: "Delayed",
                                        color: "#e16868",
                                      },
                                    ]}
                                  />
                                </div>
                              ),
                            },
                          ]
                        : []),
                    ]}
                  />

                  <AuditBreakdownTable result={result} delayMonths={delayMonths} />

                  <div className="mt-8">
                    <ScheduleTable
                      caption="Yearly schedule"
                      meta={`${yearRows.length} years`}
                      zebra
                      columns={[
                        { key: "year", header: "Year", sticky: true },
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
                  </div>
                </ResultsSection>

                <Card variant="warn">
                  <SectionTitle className="text-[var(--app-warn-text-strong)]">
                    Important investment notes
                  </SectionTitle>
                  <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-[var(--app-warn-text)] sm:columns-2 sm:gap-x-8">
                    <li>
                      Unplanned delay permanently compresses the compounding runway under the same
                      return path.
                    </li>
                    <li>
                      Headline maturity is not purchasing power. Frame conversations on the
                      inflation-adjusted corpus.
                    </li>
                    <li>
                      Tax is applied on gains only. Net after tax is the amount available to the
                      investor at exit.
                    </li>
                    <li>
                      Projections are illustrative. Actual market returns and tax rules can differ.
                    </li>
                  </ul>
                </Card>
              </Stack>
            ) : null}
          </>
        }
        footer={
          <ComplianceFootnote>
            Calculations shown are for illustration purposes only. One-time investment returns are
            compounded annually as modeled. Tax treatment depends on the investor&apos;s applicable
            rules and holding period. Market investments are subject to risk; past performance does
            not guarantee future results.
          </ComplianceFootnote>
        }
      />
      {result ? (
        <OneTimeInvestmentDossier
          data={{
            clientName: name,
            age,
            email,
            phone,
            amount,
            years,
            returnPct,
            inflationPct,
            taxPct,
            delayMonths,
            maturity: result.maturity,
            totalInvested: result.totalInvested,
            gain: result.gain,
            tax: result.tax,
            netAfterTax: result.netAfterTax,
            inflationAdjusted: result.inflationAdjusted,
            inflationAdjustedGain:
              result.inflationAdjustedGain ?? result.inflationAdjusted - result.totalInvested,
            delayedMaturity: result.delayedMaturity ?? null,
            costOfDelay: result.costOfDelay ?? null,
            schedule: yearRows,
          }}
        />
      ) : null}
    </>
  );
}
