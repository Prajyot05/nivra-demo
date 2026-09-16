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
  Field,
  formatINRCurrency,
  formatPercent,
  MoneyInput,
  PercentInput,
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
  MfVsFdDossier,
  MF_VS_FD_REPORT_ID,
} from "@/components/reports/mf-vs-fd-dossier";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import { useCalculate } from "@/hooks/use-calculate";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import { BarChart3, ChevronDown, PieChart } from "lucide-react";

const DAY_PRESETS = [7, 15, 30, 90, 180, 365] as const;
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
    <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4">
      <div className="mb-2 flex flex-col gap-1 text-xs font-semibold text-slate-600 sm:flex-row sm:items-center sm:justify-between">
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

function AuditCompareTable({ result }: { result: MfFdResult }) {
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

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-col items-center justify-center text-center">
        <span className="mb-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
          Audit Breakdown
        </span>
        <h3 className="text-sm font-bold text-slate-900">MF vs FD Post-Tax Comparative Ledger</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Side-by-side metrics for mutual fund and fixed deposit over the selected horizon
        </p>
      </div>

      <div className="flex w-full justify-center overflow-x-auto py-2">
        <div className="w-fit max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="border-collapse whitespace-nowrap text-left text-xs tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                <th className="px-5 py-3.5 text-left font-bold text-slate-800">Metric</th>
                <th className="px-5 py-3.5 text-right font-bold text-emerald-700">Mutual Fund</th>
                <th className="px-5 py-3.5 text-right font-bold text-slate-600">Fixed Deposit</th>
                <th className="px-5 py-3.5 text-right font-extrabold text-emerald-700">
                  <span className="inline-flex items-center justify-end gap-1">
                    <span>Net Advantage</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {rows.map((row) => {
                const delta = row.advantage ?? row.mf - row.fd;
                if (row.highlight) {
                  return (
                    <tr
                      key={row.label}
                      className="border-t-2 border-emerald-300/80 bg-emerald-50/70 transition-colors hover:bg-emerald-50"
                    >
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm shadow-emerald-600/20">
                          {row.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-black tabular-nums text-emerald-800">
                        {formatINRCurrency(row.mf)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-slate-700">
                        {formatINRCurrency(row.fd)}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">
                        <span className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold tracking-tight text-white shadow-sm">
                          {delta >= 0 ? "+" : ""}
                          {formatINRCurrency(delta)}
                        </span>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={row.label} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-5 py-3">
                      <span className="rounded-md border border-slate-200/80 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                        {row.label}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-semibold tabular-nums ${
                        row.tax ? "text-rose-600" : "text-slate-800"
                      }`}
                    >
                      {formatINRCurrency(row.mf)}
                    </td>
                    <td
                      className={`px-5 py-3 text-right tabular-nums ${
                        row.tax ? "font-semibold text-rose-600" : "text-slate-500"
                      }`}
                    >
                      {formatINRCurrency(row.fd)}
                    </td>
                    <td className="px-5 py-3 text-right font-bold tabular-nums text-emerald-600">
                      {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}${formatINRCurrency(delta)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
        title="Mutual Fund vs Fixed Deposit"
        description="Short-horizon post-tax compare of mutual funds vs fixed deposits (365-day count)."
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
            strategy="Tax-aware MF vs FD compare"
            goal="Post-tax arbitrage"
          />
        }
        form={
          <BentoSection
            sectionId="01"
            title="Financial Assumptions & Modeling Suite"
            description="Interactive multi-parameter engine for short-horizon MF vs FD post-tax compare"
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
                  <span>Investment Window:</span>
                  <span className="font-bold text-slate-700">
                    {days} day{days === 1 ? "" : "s"}
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
                    {horizonYears.toFixed(2)} Years ({days} Days)
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
                  label="Investment period"
                  value={days}
                  min={1}
                  max={36500}
                  suffix="Days"
                  onChange={setDays}
                  error={daysError}
                  hint={daysWarning}
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold uppercase text-slate-400">Quick:</span>
                {DAY_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDays(preset)}
                    aria-pressed={days === preset}
                    className={`${CHIP} ${days === preset ? CHIP_ON : CHIP_OFF}`}
                  >
                    {preset}D
                  </button>
                ))}
              </div>
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
                    MF {formatPercent(mfTax)} · FD {formatPercent(fdTax)}
                  </span>
                </>
              }
            >
              <div className="mb-3.5">
                <PercentInput
                  label="MF interest"
                  value={mfReturn}
                  onChange={setMfReturn}
                  error={mfInterestErr}
                />
              </div>
              <div className="mb-3.5">
                <PercentInput
                  label="FD interest"
                  value={fdReturn}
                  onChange={setFdReturn}
                  error={fdInterestErr}
                />
              </div>
              <div className="mb-3.5">
                <PercentInput
                  label="MF tax rate"
                  value={mfTax}
                  onChange={setMfTax}
                  error={mfTaxErr}
                />
              </div>
              <PercentInput
                label="FD tax rate"
                value={fdTax}
                onChange={setFdTax}
                error={fdTaxErr}
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
            {result && insight ? (
              <Stack>
                <ResultsSection
                  sectionId="02"
                  title="Post-Tax Return Arbitrage (MF vs. FD Benchmark)"
                  description="Comparison of equity-style MF vs bank FD over the selected horizon, after tax"
                  open={openArbitrage}
                  onToggle={() => setOpenArbitrage((v) => !v)}
                  meta={
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      Horizon: {horizonYears.toFixed(1)} Years
                    </span>
                  }
                >
                  <StatGrid>
                    <StatCard
                      title="MF post-tax return"
                      value={result.mf.postTax}
                      tone="positive"
                      badge={
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Equity MF
                        </span>
                      }
                      footer={
                        <div className="flex items-center justify-between">
                          <span>Net Absolute Yield:</span>
                          <span className="font-bold text-emerald-700">
                            {formatPercent(insight.mfYieldPct)}
                          </span>
                        </div>
                      }
                    />
                    <StatCard
                      title="FD post-tax return"
                      value={result.fd.postTax}
                      tone="neutral"
                      badge={
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Bank Fixed Dep.
                        </span>
                      }
                      footer={
                        <div className="flex items-center justify-between">
                          <span>Net Absolute Yield:</span>
                          <span className="font-semibold text-slate-700">
                            {formatPercent(insight.fdYieldPct)}
                          </span>
                        </div>
                      }
                    />
                    <StatCard
                      title={
                        insight.mfWins
                          ? "MF advantage"
                          : insight.fdWins
                            ? "FD advantage"
                            : "Advantage"
                      }
                      value={insight.advantage}
                      tone={insight.mfWins || insight.fdWins ? "positive" : "neutral"}
                      badge={
                        insight.relativePct > 0 ? (
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            +{insight.relativePct.toFixed(1)}% Extra
                          </span>
                        ) : undefined
                      }
                      footer={
                        <div className="flex items-center justify-between">
                          <span>Wealth Surplus:</span>
                          <span className="font-bold text-emerald-700">
                            +{formatINRCurrency(insight.advantage)} In Pocket
                          </span>
                        </div>
                      }
                    />
                  </StatGrid>

                  <div className="mt-6">
                    <YieldSplitBar
                      mfShare={insight.mfShare}
                      fdShare={insight.fdShare}
                      multiplier={insight.multiplier}
                    />
                  </div>
                </ResultsSection>

                <ResultsSection
                  sectionId="03"
                  title="Comparative Analytics"
                  description="Side-by-side bars, composition mix, and audit ledger"
                  open={openAnalytics}
                  onToggle={() => setOpenAnalytics((v) => !v)}
                >
                  <SegmentedChartControl
                    variant="pill"
                    tabs={[
                      {
                        id: "compare",
                        label: "Comparison",
                        icon: <BarChart3 className="h-3.5 w-3.5" />,
                        content: (
                          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] sm:p-8">
                            <CompareChart
                              title="MF vs FD"
                              showBarLabels
                              data={result.compare}
                              series={[
                                { key: "mf", label: "Mutual fund", color: "#00875a" },
                                { key: "fd", label: "Fixed deposit", color: "#8fa0b5" },
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
                          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] sm:p-8">
                              <CompositionChart
                                title="MF mix"
                                showPercentages
                                slices={[
                                  {
                                    name: "Invested",
                                    value: result.mf.invested,
                                    color: "#5d6f85",
                                  },
                                  {
                                    name: "Gain",
                                    value: result.mf.gain,
                                    color: "#00875a",
                                  },
                                  {
                                    name: "Tax",
                                    value: result.mf.tax,
                                    color: "#e16868",
                                  },
                                ]}
                                centerLabel="Maturity"
                                centerValue={result.mf.net}
                              />
                            </div>
                            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] sm:p-8">
                              <CompositionChart
                                title="FD mix"
                                showPercentages
                                slices={[
                                  {
                                    name: "Invested",
                                    value: result.fd.invested,
                                    color: "#5d6f85",
                                  },
                                  {
                                    name: "Gain",
                                    value: result.fd.gain,
                                    color: "#00875a",
                                  },
                                  {
                                    name: "Tax",
                                    value: result.fd.tax,
                                    color: "#e16868",
                                  },
                                ]}
                                centerLabel="Maturity"
                                centerValue={result.fd.net}
                              />
                            </div>
                          </div>
                        ),
                      },
                    ]}
                  />

                  <AuditCompareTable result={result} />
                </ResultsSection>

                <Card variant="warn">
                  <SectionTitle className="text-[var(--app-warn-text-strong)]">
                    Important investment notes
                  </SectionTitle>
                  <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-[var(--app-warn-text)] sm:columns-2 sm:gap-x-8">
                    <li>
                      Fixed Deposits may charge a premature withdrawal penalty, even for partial
                      withdrawals.
                    </li>
                    <li>
                      Debt/Arbitrage Mutual Funds provide flexibility in investment duration, unlike
                      FDs where tenure is fixed at the start.
                    </li>
                  </ul>
                </Card>
              </Stack>
            ) : null}
          </>
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
