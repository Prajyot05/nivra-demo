"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  formatINRCurrency,
  formatPercent,
  StatusNote,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import {
  MfVsFdDossier,
  MF_VS_FD_REPORT_ID,
} from "@/components/reports/mf-vs-fd-dossier";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import { useCalculate } from "@/hooks/use-calculate";
import {
  getCalculatorPageDescription,
  getCalculatorPageTitle,
} from "@/lib/calculator-nav";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import {
  IconChart,
  IconDonut,
  IconPerson,
  IconRates,
  IconRefresh,
  IconTarget,
  WEALTH_CONTENT_CLASS,
  WEALTH_DAY_PRESETS_DEFAULT,
  WealthCompareBars,
  WealthDisclaimer,
  WealthHero,
  WealthIconMark,
  WealthMetricCard,
  WealthMixDonut,
  WealthMoneyField,
  WealthPercentField,
  WealthAgeField,
  WealthAuditChip,
  WealthAuditLedger,
  WealthProfileGrid,
  WealthSegmented,
  WealthAnalyticsChrome,
  WealthSection,
  WealthTextField,
  WealthYearField,
  wealthChart,
  wealthMixColors,
  IconCalendar,
} from "@/components/wealth";

const AMOUNT_MIN = 10_000;
const AMOUNT_MAX = 100_00_00_000; // ₹100 Cr
const AMOUNT_STEP = 1_00_000;
const AMOUNT_PRESETS = [
  { label: "₹1L", value: 1_00_000 },
  { label: "₹10L", value: 10_00_000 },
  { label: "₹50L", value: 50_00_000 },
  { label: "₹1Cr", value: 1_00_00_000 },
  { label: "₹10Cr", value: 10_00_00_000 },
] as const;

const DAY_SLIDER_MAX = 3650; // 10 years on the slider; typing still allows longer
const DAY_PRESETS = WEALTH_DAY_PRESETS_DEFAULT;

type Leg = {
  invested: number;
  gain: number;
  tax: number;
  net: number;
  preTax: number;
  postTax: number;
  annualizedReturn: number;
  returnPerDay: number;
};

type MfFdResult = {
  mf: Leg;
  fd: Leg;
  difference: number;
  mfAdvantage: number;
  fdAdvantage: number;
  compare: Array<{ category: string; mf: number; fd: number }>;
};

type AnalyticsTab = "mix" | "compare";

function interestError(value: number, label: string): string | undefined {
  if (!Number.isFinite(value)) return `${label} must be a valid number.`;
  if (value < 0) return `${label} cannot be negative.`;
  if (value > 100) return `${label} cannot exceed 100%.`;
  return undefined;
}

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
  // Practical email check (not exhaustive RFC)
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

function daysErrorMsg(value: number): string | undefined {
  if (!Number.isFinite(value)) return "Investment period must be a valid number.";
  if (value < 1) return "Investment period must be at least 1 day.";
  if (value > 36500) return "Investment period cannot exceed 36,500 days (100 years).";
  return undefined;
}

function YieldSplitBar({
  mfShare,
  fdShare,
  multiplier,
}: {
  mfShare: number;
  fdShare: number;
  multiplier: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
      <div className="mb-2 flex flex-col gap-1 text-xs font-medium text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>Relative Yield Distribution:</span>
        <span>
          Mutual Fund yields{" "}
          <strong className="text-emerald-700">{multiplier.toFixed(2)}×</strong> of Traditional
          Fixed Deposit
        </span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-l-full bg-emerald-600 transition-all duration-500"
          style={{ width: `${mfShare}%` }}
        />
        <div
          className="h-full rounded-r-full bg-slate-400 transition-all duration-500"
          style={{ width: `${fdShare}%` }}
        />
      </div>
      <div className="mt-2 flex flex-col gap-1 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-600" />
          Equity Mutual Fund Post-Tax ({mfShare.toFixed(1)}%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-400" />
          Fixed Deposit Post-Tax ({fdShare.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}

function AuditCompareTable({
  result,
  insight,
  days,
  horizonYears,
}: {
  result: MfFdResult;
  insight: {
    mfWins: boolean;
    fdWins: boolean;
    advantage: number;
    relativePct: number;
    mfYieldPct: number;
    fdYieldPct: number;
    multiplier: number;
  };
  days: number;
  horizonYears: number;
}) {
  const rows: Array<{
    label: string;
    mf: number;
    fd: number;
    advantage?: number;
    highlight?: boolean;
    tax?: boolean;
  }> = [
    {
      label: "Annualized return",
      mf: result.mf.annualizedReturn,
      fd: result.fd.annualizedReturn,
    },
    {
      label: "Return per day",
      mf: result.mf.returnPerDay,
      fd: result.fd.returnPerDay,
    },
    {
      label: "Expected pre-tax return",
      mf: result.mf.preTax,
      fd: result.fd.preTax,
    },
    {
      label: "Tax on profit",
      mf: result.mf.tax,
      fd: result.fd.tax,
      tax: true,
    },
    {
      label: "Post-tax return",
      mf: result.mf.postTax,
      fd: result.fd.postTax,
    },
    {
      label: "Difference in return",
      mf: result.mfAdvantage,
      fd: result.fdAdvantage,
      advantage: Math.max(result.mfAdvantage, result.fdAdvantage),
    },
    {
      label: "Final maturity amount",
      mf: result.mf.net,
      fd: result.fd.net,
      highlight: true,
      advantage: result.mf.net - result.fd.net,
    },
  ];

  const winner = insight.mfWins ? "Mutual Fund" : insight.fdWins ? "Fixed Deposit" : "Neither";
  const taxDragMf =
    result.mf.preTax > 0 ? (result.mf.tax / result.mf.preTax) * 100 : 0;
  const taxDragFd =
    result.fd.preTax > 0 ? (result.fd.tax / result.fd.preTax) * 100 : 0;

  return (
    <WealthAuditLedger
      stats={[
        {
          label: "Horizon",
          value: `${days} days`,
          hint: `${horizonYears.toFixed(2)} years · day-count basis 365`,
        },
        {
          label: "Post-tax edge",
          value:
            insight.advantage > 0
              ? `+${formatINRCurrency(insight.advantage)}`
              : formatINRCurrency(0),
          hint: `${winner}${
            insight.relativePct > 0
              ? ` · +${insight.relativePct.toFixed(1)}% vs alternate`
              : ""
          }`,
          tone: "emerald",
        },
        {
          label: "Yield multiple",
          value: `${insight.multiplier.toFixed(2)}×`,
          hint: `MF post-tax ${formatPercent(insight.mfYieldPct)} · FD ${formatPercent(insight.fdYieldPct)}`,
        },
      ]}
      chips={
        <>
          <WealthAuditChip label="MF tax drag">
            {formatPercent(taxDragMf, 1)} of pre-tax gain (
            {formatINRCurrency(result.mf.tax)})
          </WealthAuditChip>
          <WealthAuditChip label="FD tax drag">
            {formatPercent(taxDragFd, 1)} of pre-tax gain (
            {formatINRCurrency(result.fd.tax)})
          </WealthAuditChip>
        </>
      }
      columns={["Metric", "Mutual Fund", "Fixed Deposit", "Net Advantage"]}
      rows={rows.map((row) => {
        const delta = row.advantage ?? row.mf - row.fd;
        if (row.highlight) {
          return {
            label: row.label,
            highlight: true,
            cells: [
              { text: formatINRCurrency(row.mf), tone: "emerald" as const },
              { text: formatINRCurrency(row.fd) },
              {
                text: `${delta >= 0 ? "+" : ""}${formatINRCurrency(delta)}`,
                tone: "pill" as const,
              },
            ],
          };
        }
        return {
          label: row.label,
          tax: row.tax,
          cells: [
            {
              text: formatINRCurrency(row.mf),
              tone: row.tax ? ("rose" as const) : ("default" as const),
            },
            {
              text: formatINRCurrency(row.fd),
              tone: row.tax ? ("rose" as const) : ("muted" as const),
            },
            {
              text:
                delta === 0
                  ? "Equal"
                  : `${delta > 0 ? "+" : ""}${formatINRCurrency(delta)}`,
              tone: "emerald" as const,
            },
          ],
        };
      })}
      note={`Ledger uses the stated MF and FD rates with their tax rates over ${days} days. Absolute yields are post-tax profit on invested capital. Premature FD exit and market risk on mutual funds are not modelled here.`}
    />
  );
}

export function MfVsFd() {
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(30);
  const [email, setEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [phone, setPhone] = useState(DUMMY_REPORT_CONTACT.phone);
  const [amount, setAmount] = useState(10_000_000);
  const [days, setDays] = useState(15);
  const [mfReturn, setMfReturn] = useState(5);
  const [fdReturn, setFdReturn] = useState(3);
  const [mfTax, setMfTax] = useState(20);
  const [fdTax, setFdTax] = useState(25);

  const [openAssumptions, setOpenAssumptions] = useState(true);
  const [openArbitrage, setOpenArbitrage] = useState(true);
  const [openAnalytics, setOpenAnalytics] = useState(true);
  const [openAudit, setOpenAudit] = useState(true);
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>("mix");
  const assumptionsRef = useRef<HTMLDivElement>(null);

  const clientNameError = nameError(name);
  const clientAgeError = ageError(age);
  const clientEmailError = emailError(email);
  const clientPhoneError = phoneError(phone);
  const amountError = amountErrorMsg(amount, AMOUNT_MAX);
  const daysError = daysErrorMsg(days);
  const daysWarning =
    !daysError && days > 3650 ? "Unusually long duration (over 10 years)." : undefined;
  const mfInterestErr = interestError(mfReturn, "MF interest");
  const fdInterestErr = interestError(fdReturn, "FD interest");
  const mfTaxErr = interestError(mfTax, "MF tax rate");
  const fdTaxErr = interestError(fdTax, "FD tax rate");

  const fieldErrors = [
    clientNameError,
    clientAgeError,
    clientEmailError,
    clientPhoneError,
    amountError,
    daysError,
    mfInterestErr,
    fdInterestErr,
    mfTaxErr,
    fdTaxErr,
  ].filter((msg): msg is string => Boolean(msg));

  const canCalculate = fieldErrors.length === 0;

  const input = useMemo(
    () => ({
      clientName: name,
      age,
      amount,
      days,
      mfReturnPct: mfReturn,
      fdReturnPct: fdReturn,
      mfTaxPct: mfTax,
      fdTaxPct: fdTax,
    }),
    [name, age, amount, days, mfReturn, fdReturn, mfTax, fdTax],
  );

  const { result, error, loading } = useCalculate<MfFdResult>("mf-fd", input, canCalculate);
  const [isDownloading, setIsDownloading] = useState(false);

  const insight = useMemo(() => {
    if (!result) return null;
    const mfWins = result.mfAdvantage > result.fdAdvantage;
    const fdWins = result.fdAdvantage > result.mfAdvantage;
    const advantage = mfWins ? result.mfAdvantage : result.fdAdvantage;
    const base = mfWins ? result.fd.postTax : result.mf.postTax;
    const relativePct = base > 0 ? (advantage / base) * 100 : 0;
    const totalPost = result.mf.postTax + result.fd.postTax;
    const mfShare = totalPost > 0 ? (result.mf.postTax / totalPost) * 100 : 50;
    const fdShare = 100 - mfShare;
    const multiplier =
      result.fd.postTax > 0 ? result.mf.postTax / result.fd.postTax : result.mf.postTax > 0 ? 1 : 0;
    const mfYieldPct =
      result.mf.invested > 0 ? (result.mf.postTax / result.mf.invested) * 100 : 0;
    const fdYieldPct =
      result.fd.invested > 0 ? (result.fd.postTax / result.fd.invested) * 100 : 0;
    return {
      advantage,
      relativePct,
      mfWins,
      fdWins,
      mfShare,
      fdShare,
      multiplier,
      mfYieldPct,
      fdYieldPct,
    };
  }, [result]);

  const horizonYears = days / 365;

  const resetDefaults = () => {
    setName("Mr. Anshu Kaul");
    setAge(30);
    setEmail(DUMMY_REPORT_CONTACT.email);
    setPhone(DUMMY_REPORT_CONTACT.phone);
    setAmount(10_000_000);
    setDays(15);
    setMfReturn(5);
    setFdReturn(3);
    setMfTax(20);
    setFdTax(25);
  };

  const scrollToAssumptions = () => {
    setOpenAssumptions(true);
    assumptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      await generatePdfFromElement(MF_VS_FD_REPORT_ID, `mf-vs-fd-${safe || "report"}`);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <CalculatorPage
        title={getCalculatorPageTitle("/mf-fd")}
        description={getCalculatorPageDescription("/mf-fd")}
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
            goalLabel="MF vs FD"
            tenure={Math.max(1, Math.round(horizonYears))}
            strategy="Post-tax yield compare"
            metrics={[
              {
                label: "Investment",
                value: amount,
                kind: "currency",
                tone: "emerald",
                mark: (
                  <WealthIconMark tone="emerald" className="h-6 w-6">
                    <IconTarget className="h-3.5 w-3.5" />
                  </WealthIconMark>
                ),
              },
              {
                label: "MF post-tax",
                value: result?.mf.postTax ?? 0,
                kind: "currency",
                tone: "slate",
                mark: (
                  <WealthIconMark className="h-6 w-6">
                    <IconChart className="h-3.5 w-3.5" />
                  </WealthIconMark>
                ),
              },
              {
                label: "FD post-tax",
                value: result?.fd.postTax ?? 0,
                kind: "currency",
                tone: "slate",
                mark: (
                  <WealthIconMark className="h-6 w-6">
                    <IconRates className="h-3.5 w-3.5" />
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
            subtitle="Client identity, investment amount, horizon, and return or tax rates"
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
                    presets: [...AMOUNT_PRESETS],
                  }}
                />
                <WealthYearField
                  label="Investment period"
                  value={days}
                  min={1}
                  max={36500}
                  suffix="Days"
                  onChange={setDays}
                  error={daysError}
                  hint={daysWarning}
                  slider={{
                    min: 1,
                    max: DAY_SLIDER_MAX,
                    step: 1,
                    scale: "log",
                    presets: DAY_PRESETS,
                    formatBound: (v) =>
                      v >= 365 ? `${(v / 365).toFixed(v % 365 === 0 ? 0 : 1)} yr` : `${v}d`,
                  }}
                />
                <WealthPercentField
                  label="MF interest"
                  value={mfReturn}
                  onChange={setMfReturn}
                  error={mfInterestErr}
                />
                <WealthPercentField
                  label="FD interest"
                  value={fdReturn}
                  onChange={setFdReturn}
                  error={fdInterestErr}
                />
                <WealthPercentField
                  label="MF tax rate"
                  value={mfTax}
                  onChange={setMfTax}
                  error={mfTaxErr}
                />
                <WealthPercentField
                  label="FD tax rate"
                  value={fdTax}
                  onChange={setFdTax}
                  error={fdTaxErr}
                />
              </WealthProfileGrid>
            </div>
          </WealthSection>
          </div>
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
            {result && insight ? (
              <div className="space-y-5">
                <WealthSection
                  badge="02 · Results"
                  title="Post-Tax Return Arbitrage"
                  subtitle="Equity-style MF vs bank FD over the selected horizon, after tax"
                  open={openArbitrage}
                  onToggle={() => setOpenArbitrage((v) => !v)}
                  mark={
                    <WealthIconMark tone="emerald">
                      <IconTarget />
                    </WealthIconMark>
                  }
                  actions={
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      Horizon: {horizonYears.toFixed(1)} Years
                    </span>
                  }
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <WealthMetricCard
                      title="MF post-tax return"
                      value={result.mf.postTax}
                      description="Equity mutual fund net yield after tax"
                      badge="Equity MF"
                      tone="positive"
                      trend={`Net absolute yield ${formatPercent(insight.mfYieldPct)}`}
                      mark={
                        <WealthIconMark tone="emerald" className="h-7 w-7">
                          <IconChart className="h-3.5 w-3.5" />
                        </WealthIconMark>
                      }
                    />
                    <WealthMetricCard
                      title="FD post-tax return"
                      value={result.fd.postTax}
                      description="Bank fixed deposit net yield after tax"
                      badge="Bank FD"
                      tone="neutral"
                      trend={`Net absolute yield ${formatPercent(insight.fdYieldPct)}`}
                      mark={
                        <WealthIconMark className="h-7 w-7">
                          <IconRates className="h-3.5 w-3.5" />
                        </WealthIconMark>
                      }
                    />
                    <WealthMetricCard
                      title={
                        insight.mfWins
                          ? "MF advantage"
                          : insight.fdWins
                            ? "FD advantage"
                            : "Advantage"
                      }
                      value={insight.advantage}
                      description="Wealth surplus vs the alternate path"
                      badge={
                        insight.relativePct > 0
                          ? `+${insight.relativePct.toFixed(1)}% extra`
                          : undefined
                      }
                      tone={insight.mfWins || insight.fdWins ? "positive" : "neutral"}
                      footer={
                        <>
                          In pocket ·{" "}
                          <span className="font-semibold tabular-nums text-emerald-700">
                            +{formatINRCurrency(insight.advantage)}
                          </span>
                        </>
                      }
                      mark={
                        <WealthIconMark tone="emerald" className="h-7 w-7">
                          <IconTarget className="h-3.5 w-3.5" />
                        </WealthIconMark>
                      }
                    />
                  </div>

                  <div className="mt-6">
                    <YieldSplitBar
                      mfShare={insight.mfShare}
                      fdShare={insight.fdShare}
                      multiplier={insight.multiplier}
                    />
                  </div>
                </WealthSection>

                <WealthSection
                  badge="03 · Analytics"
                  title="Comparative Analytics"
                  subtitle="Corpus mix and side-by-side post-tax comparison"
                  open={openAnalytics}
                  onToggle={() => setOpenAnalytics((v) => !v)}
                  mark={
                    <WealthIconMark>
                      <IconChart />
                    </WealthIconMark>
                  }
                >
                  <div className="space-y-4">
                    <WealthAnalyticsChrome
                      tabs={
                        <WealthSegmented
                          layoutId="mf-fd-analytics-underline"
                          variant="underline"
                          value={analyticsTab}
                          onChange={setAnalyticsTab}
                          options={[
                            {
                              id: "mix",
                              label: "Corpus Mix",
                              icon: <IconDonut className="h-3.5 w-3.5" />,
                            },
                            {
                              id: "compare",
                              label: "Compare",
                              icon: <IconChart className="h-3.5 w-3.5" />,
                            },
                          ]}
                        />
                      }
                    >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={analyticsTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                        className="space-y-4"
                      >
                        {analyticsTab === "mix" ? (
                          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            <WealthMixDonut
                              title="Mutual Fund"
                              centerValue={result.mf.preTax}
                              tax={result.mf.tax}
                              net={result.mf.net}
                              netLabel="Maturity"
                              slices={[
                                {
                                  name: "Invested",
                                  value: result.mf.invested,
                                  color: wealthMixColors.invested,
                                },
                                {
                                  name: "Gain",
                                  value: result.mf.gain,
                                  color: wealthMixColors.gain,
                                },
                              ]}
                            />
                            <WealthMixDonut
                              title="Fixed Deposit"
                              centerValue={result.fd.preTax}
                              tax={result.fd.tax}
                              net={result.fd.net}
                              netLabel="Maturity"
                              slices={[
                                {
                                  name: "Invested",
                                  value: result.fd.invested,
                                  color: wealthMixColors.secondary,
                                },
                                {
                                  name: "Gain",
                                  value: result.fd.gain,
                                  color: wealthMixColors.secondaryGain,
                                },
                              ]}
                            />
                          </div>
                        ) : null}

                        {analyticsTab === "compare" ? (
                          <WealthCompareBars
                            showBarLabels
                            data={result.compare}
                            series={[
                              { key: "mf", label: "Mutual fund", color: wealthChart.stepUp },
                              { key: "fd", label: "Fixed deposit", color: wealthChart.standard },
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
                  title="MF vs FD Post-Tax Comparative Ledger"
                  subtitle="Horizon, tax drag, yield multiple, and line-by-line maturity audit"
                  open={openAudit}
                  onToggle={() => setOpenAudit((v) => !v)}
                  mark={
                    <WealthIconMark>
                      <IconCalendar />
                    </WealthIconMark>
                  }
                >
                  <AuditCompareTable
                    result={result}
                    insight={insight}
                    days={days}
                    horizonYears={horizonYears}
                  />
                </WealthSection>

              </div>
            ) : null}
          </>
        }
        footer={
          result ? (
            <WealthDisclaimer
              notes={[
                "Fixed deposits may charge a premature withdrawal penalty, even for partial withdrawals.",
                "Debt or arbitrage mutual funds allow flexible holding periods, unlike FDs where tenure is fixed at the start.",
              ]}
            >
              Figures are for illustration only. MF and FD projections use the stated rates and tax
              assumptions on a 365-day basis. Markets carry risk; past performance does not guarantee
              future results.
            </WealthDisclaimer>
          ) : null
        }
      />
      {result ? (
        <MfVsFdDossier
          data={{
            clientName: name,
            age,
            amount,
            days,
            mfReturnPct: mfReturn,
            fdReturnPct: fdReturn,
            mfTaxPct: mfTax,
            fdTaxPct: fdTax,
            mf: result.mf,
            fd: result.fd,
            mfAdvantage: result.mfAdvantage,
            fdAdvantage: result.fdAdvantage,
            difference: result.difference,
            email,
            phone,
          }}
        />
      ) : null}
    </>
  );
}
