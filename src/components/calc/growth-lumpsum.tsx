"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  formatINRCurrency,
  formatPercent,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import {
  OneTimeInvestmentDossier,
  ONE_TIME_INVESTMENT_REPORT_ID,
} from "@/components/reports/one-time-investment-dossier";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import { useCalculate } from "@/hooks/use-calculate";
import { getCalculatorPageDescription, getCalculatorPageTitle } from "@/lib/calculator-nav";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import {
  IconCalendar,
  IconChart,
  IconDelay,
  IconDonut,
  IconPerson,
  IconRates,
  IconRefresh,
  IconSip,
  IconTarget,
  IconTax,
  moneyCell,
  WEALTH_CONTENT_CLASS,
  WEALTH_MONEY_PRESETS_DEFAULT,
  WEALTH_YEAR_PRESETS_DEFAULT,
  WealthAgeField,
  WealthAuditChip,
  WealthAuditLedger,
  WealthCompareBars,
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
  WealthAnalyticsChrome,
  WealthStatusNote,
  WealthTextField,
  WealthYearField,
  wealth,
  wealthChart,
  wealthMixColors,
} from "@/components/wealth";

const AMOUNT_MIN = 10_000;
const AMOUNT_MAX = 100_00_00_000; // ₹100 Cr
const AMOUNT_STEP = 1_00_000;
const AMOUNT_PRESETS = [
  ...WEALTH_MONEY_PRESETS_DEFAULT,
  { label: "₹10Cr", value: 10_00_00_000 },
];
const YEARS_MAX = 100;
const YEARS_SLIDER_MAX = 40;

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

type AuditRow = {
  label: string;
  value: number;
  tax?: boolean;
  highlight?: boolean;
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

function buildAuditRows(result: LumpsumResult, delayMonths: number): AuditRow[] {
  const rows: AuditRow[] = [
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

  return rows;
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
  const [openSchedule, setOpenSchedule] = useState(true);
  const [chartTab, setChartTab] = useState<"growth" | "allocation" | "delay">("growth");
  const assumptionsRef = useRef<HTMLDivElement>(null);

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

  const scrollToAssumptions = () => {
    setOpenAssumptions(true);
    assumptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const yearRows = result?.schedule ?? [];
  const auditRows = result ? buildAuditRows(result, delayMonths) : [];
  const activeChartTab =
    chartTab === "delay" && !hasDelay ? "growth" : chartTab;

  return (
    <>
      <CalculatorPage
        title={getCalculatorPageTitle("/growth", "lumpsum")}
        description={getCalculatorPageDescription("/growth", "lumpsum")}
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
            goalLabel="Capital growth"
            tenure={years}
            strategy="One-time lumpsum compounding"
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
                value: result?.totalInvested ?? amount,
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
            subtitle="Client, lumpsum, rates, and start delay"
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
                label="Investment amount"
                value={amount}
                onChange={(v) => setAmount(Math.min(AMOUNT_MAX, Math.max(0, v)))}
                error={amountError}
                max={AMOUNT_MAX}
                suffix="₹"
                slider={{
                  min: AMOUNT_MIN,
                  max: AMOUNT_MAX,
                  step: AMOUNT_STEP,
                  scale: "log",
                  presets: AMOUNT_PRESETS,
                }}
              />
              <WealthYearField
                label="Term"
                value={years}
                min={1}
                max={YEARS_MAX}
                suffix="Years"
                onChange={setYears}
                error={yearsError}
                slider={{
                  min: 1,
                  max: YEARS_SLIDER_MAX,
                  step: 1,
                  presets: WEALTH_YEAR_PRESETS_DEFAULT,
                }}
              />
              <WealthYearField
                label="Delay"
                value={delayMonths}
                min={0}
                max={1200}
                suffix="Months"
                onChange={(v) => setDelayMonths(Math.max(0, v))}
                error={delayError}
              />
              <WealthPercentField
                label="Expected return"
                value={returnPct}
                onChange={(v) => setReturnPct(Math.max(0, v))}
                error={returnError}
              />
              <WealthPercentField
                label="Inflation"
                value={inflationPct}
                onChange={(v) => setInflationPct(Math.max(0, v))}
                error={inflationError}
              />
              <WealthPercentField
                label="Tax"
                value={taxPct}
                onChange={(v) => setTaxPct(Math.max(0, v))}
                error={taxError}
              />
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
              <div className="space-y-5">
                <WealthSection
                  badge="02 · Milestones"
                  title="Growth Milestones"
                  subtitle="Nominal maturity, purchasing power, and net outcome after tax"
                  open={openMilestones}
                  onToggle={() => setOpenMilestones((v) => !v)}
                  mark={
                    <WealthIconMark tone="emerald">
                      <IconChart />
                    </WealthIconMark>
                  }
                  actions={
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      Horizon: {years} Years
                    </span>
                  }
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <WealthMetricCard
                      title="Maturity"
                      value={result.maturity}
                      description="Nominal corpus at the end of the tenure"
                      badge="Nominal"
                      tone="positive"
                      footer={
                        <>
                          Invested ·{" "}
                          <span className="font-semibold tabular-nums text-emerald-700">
                            {formatINRCurrency(result.totalInvested)}
                          </span>
                        </>
                      }
                      mark={
                        <WealthIconMark tone="emerald" className="h-7 w-7">
                          <IconChart className="h-3.5 w-3.5" />
                        </WealthIconMark>
                      }
                    />
                    <WealthMetricCard
                      title="Inflation adjusted"
                      value={result.inflationAdjusted}
                      description="Purchasing power in today rupees"
                      badge="Today rupees"
                      tone="neutral"
                      footer={
                        <>
                          Real yield ·{" "}
                          <span className="font-semibold tabular-nums text-slate-700">
                            {formatPercent(realYieldPct)}
                          </span>
                        </>
                      }
                      mark={
                        <WealthIconMark className="h-7 w-7">
                          <IconRates className="h-3.5 w-3.5" />
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
                            Gain after tax ·{" "}
                            <span className="font-semibold tabular-nums text-emerald-700">
                              {formatINRCurrency(result.gain - result.tax)}
                            </span>
                          </>
                        )
                      }
                      mark={
                        <WealthIconMark
                          className="h-7 w-7"
                          tone={hasDelay ? "amber" : "emerald"}
                        >
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
                  subtitle="Corpus path, allocation mix, and delay compare"
                  open={openAnalytics}
                  onToggle={() => setOpenAnalytics((v) => !v)}
                  mark={
                    <WealthIconMark>
                      <IconRates />
                    </WealthIconMark>
                  }
                >
                  <div className="space-y-5">
                    <WealthAnalyticsChrome
                      tabs={
                        <WealthSegmented
                          layoutId="lumpsum-analytics-underline"
                          variant="underline"
                          value={activeChartTab}
                          onChange={(id) => setChartTab(id)}
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
                            ...(hasDelay
                              ? [
                                  {
                                    id: "delay" as const,
                                    label: "Delay",
                                    icon: <IconDelay className="h-3.5 w-3.5" />,
                                  },
                                ]
                              : []),
                          ]}
                        />
                      }
                    >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeChartTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                      >
                        {activeChartTab === "growth" ? (
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
                        ) : null}

                        {activeChartTab === "allocation" ? (
                          <WealthMixDonut
                            title="Corpus mix"
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
                        ) : null}

                        {activeChartTab === "delay" && hasDelay ? (
                          <WealthCompareBars
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
                                color: wealthChart.stepUp,
                              },
                              {
                                key: "delayed",
                                label: "Delayed",
                                color: wealth.rose,
                              },
                            ]}
                          />
                        ) : null}
                      </motion.div>
                    </AnimatePresence>
                    </WealthAnalyticsChrome>
                  </div>
                </WealthSection>

                <WealthSection
                  badge="04 · Audit"
                  title="Lumpsum Outcome Ledger"
                  subtitle="Horizon, tax drag, yield, and line-by-line maturity audit"
                  open={openSchedule}
                  onToggle={() => setOpenSchedule((v) => !v)}
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
                          value: `${years} yr${years === 1 ? "" : "s"}`,
                          hint:
                            delayMonths > 0
                              ? `${delayMonths} mo start delay`
                              : "One-time investment",
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
                          hint: `Inflation-adj. ${formatPercent(realYieldPct)}`,
                        },
                      ]}
                      chips={
                        <>
                          <WealthAuditChip label="Tax drag">
                            {result.gain > 0
                              ? `${formatPercent((result.tax / result.gain) * 100, 1)} of pre-tax gain (${formatINRCurrency(result.tax)})`
                              : `${formatINRCurrency(result.tax)} on gains`}
                          </WealthAuditChip>
                          <WealthAuditChip label="Principal">
                            {formatINRCurrency(result.totalInvested)}
                            {hasDelay && result.costOfDelay != null
                              ? ` · delay cost ${formatINRCurrency(result.costOfDelay)}`
                              : ""}
                          </WealthAuditChip>
                        </>
                      }
                      columns={["Metric", "Amount"]}
                      rows={auditRows.map((row) => ({
                        label: row.label,
                        tax: row.tax,
                        highlight: row.highlight && row.label === "Net after tax",
                        cells: [
                          {
                            text: formatINRCurrency(row.value),
                            tone: row.highlight
                              ? row.label === "Net after tax"
                                ? ("pill" as const)
                                : ("emerald" as const)
                              : row.tax
                                ? ("rose" as const)
                                : ("default" as const),
                          },
                        ],
                      }))}
                      note={`Ledger uses the stated return, inflation, and tax over ${years} year${years === 1 ? "" : "s"}. Absolute yields are post-tax profit on invested capital. Market path risk is not modelled here.`}
                    />

                    <WealthDataTable
                      rows={yearRows}
                      getRowKey={(row) => row.year}
                      filterPlaceholder="Filter by year…"
                      note="Year-end corpus and inflation-adjusted purchasing power for each year of the lumpsum horizon."
                      columns={[
                        {
                          key: "year",
                          header: "Year",
                          sticky: true,
                          searchValue: (row) => String(row.year),
                          render: (row) => row.year,
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
                  </div>
                </WealthSection>
              </div>
            ) : null}
          </>
        }
        footer={
          result ? (
            <WealthDisclaimer
              notes={[
                "Unplanned delay permanently compresses the compounding runway under the same return path.",
                "Headline maturity is not purchasing power. Frame conversations on the inflation-adjusted corpus.",
                "Tax is applied on gains only. Net after tax is the amount available to the investor at exit.",
                "Projections are illustrative. Actual market returns and tax rules can differ.",
              ]}
            >
              Figures are for illustration only. One-time investments compound annually as modeled.
              Tax depends on the investor&apos;s applicable rules and holding period. Markets carry
              risk; past performance does not guarantee future results.
            </WealthDisclaimer>
          ) : null
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
