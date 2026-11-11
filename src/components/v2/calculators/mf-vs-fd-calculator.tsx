"use client";

import { useMemo, useState } from "react";
import {
  CompareChart,
  CompositionChart,
  formatINRCurrency,
  formatPercent,
} from "@nivra/ui";
import { DAYS_MAX } from "@nivra/ui/limits";
import { V2_MONEY_INPUT_MAX } from "@/components/v2/tokens";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import {
  V2MfVsFdAdvisoryDossier,
  V2_MF_VS_FD_REPORT_ID,
} from "@/components/v2/reports/mf-vs-fd-advisory-dossier";
import { V2ChartFrame, V2_CHART_CLASS } from "@/components/v2/chart-frame";
import {
  V2MoneyField,
  V2NumberField,
  V2PercentField,
  V2TextField,
  V2FieldRow,
  V2FormScope,
} from "@/components/v2/fields";
import { useV2Theme } from "@/components/v2/theme";
import {
  V2Button,
  V2CalculatorLayout,
  V2Disclaimer,
  V2Metric,
  V2MetricStrip,
  V2PageHeader,
  V2Section,
  V2Status,
  V2Table,
} from "@/components/v2/ui";
import { useCalculate } from "@/hooks/use-calculate";
import { generatePdfFromElement } from "@/lib/pdf-generator";

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

export function V2MfVsFdCalculator() {
  const { chart } = useV2Theme();
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(45);
  const [email, setEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [phone, setPhone] = useState(DUMMY_REPORT_CONTACT.phone);
  const [amount, setAmount] = useState(10_000_000);
  const [days, setDays] = useState(1825);
  const [mfReturn, setMfReturn] = useState(12);
  const [fdReturn, setFdReturn] = useState(7);
  const [mfTax, setMfTax] = useState(12.5);
  const [fdTax, setFdTax] = useState(20);
  const [isDownloading, setIsDownloading] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  const clientNameError = nameError(name);
  const clientAgeError = ageError(age);
  const clientEmailError = emailError(email);
  const clientPhoneError = phoneError(phone);
  const amountError =
    !Number.isFinite(amount) || amount <= 0
      ? "Investment amount is required."
      : amount > V2_MONEY_INPUT_MAX
        ? `Amount cannot exceed ₹${V2_MONEY_INPUT_MAX.toLocaleString("en-IN")}.`
        : undefined;
  const daysError =
    !Number.isFinite(days) || days < 1
      ? "Investment period must be at least 1 day."
      : days > DAYS_MAX
        ? "Investment period cannot exceed 36,500 days (100 years)."
        : undefined;
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

  const { result, error, loading } = useCalculate<MfFdResult>("mf-fd", input, canCalculate, {
    debounceMs: 60,
  });

  const insight = useMemo(() => {
    if (!result) return null;
    const mfWins = result.mfAdvantage > result.fdAdvantage;
    const fdWins = result.fdAdvantage > result.mfAdvantage;
    const advantage = mfWins ? result.mfAdvantage : result.fdAdvantage;
    const winner = mfWins ? "Mutual Fund" : fdWins ? "Fixed Deposit" : "Neither";
    return { mfWins, fdWins, advantage, winner };
  }, [result]);

  const horizonYears = days / 365;

  const resetDefaults = () => {
    setName("Mr. Anshu Kaul");
    setAge(45);
    setEmail(DUMMY_REPORT_CONTACT.email);
    setPhone(DUMMY_REPORT_CONTACT.phone);
    setAmount(10_000_000);
    setDays(1825);
    setMfReturn(12);
    setFdReturn(7);
    setMfTax(12.5);
    setFdTax(20);
    setFormResetKey((k) => k + 1);
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
      await generatePdfFromElement(V2_MF_VS_FD_REPORT_ID, `mf-vs-fd-${safe || "report"}`);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <V2PageHeader
        title="MF vs FD Calculator"
        description="Compare mutual fund and fixed deposit outcomes on a post-tax, day-count basis."
        actions={
          <ReportDownloadButton
            onClick={handleDownload}
            disabled
            title="Report PDF coming soon"
          />
        }
      />

      <V2CalculatorLayout
        resultsLoading={loading && !result && canCalculate}
        form={
          <V2Section
            title="Inputs"
            subtitle="Investment amount, horizon, and rates"
            actions={<V2Button onClick={resetDefaults}>Reset</V2Button>}
          >
            <V2FormScope resetKey={formResetKey}>
            <div className="space-y-2.5">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--v2-faint)]">
                  Client
                </p>
                <V2FieldRow>
                  <V2TextField
                    label="Client name"
                    value={name}
                    onChange={setName}
                    error={clientNameError}
                    width="name"
                    autoComplete="name"
                  />
                  <V2NumberField
                    label="Age"
                    value={age}
                    onChange={setAge}
                    error={clientAgeError}
                    min={18}
                    max={100}
                    width="age"
                  />
                  <V2TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    error={clientEmailError}
                    width="email"
                    autoComplete="email"
                  />
                  <V2TextField
                    label="Phone"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    error={clientPhoneError}
                    width="phone"
                    autoComplete="tel"
                  />
                </V2FieldRow>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--v2-faint)]">
                  Investment
                </p>
                <V2FieldRow>
                  <V2MoneyField
                    label="Amount"
                    value={amount}
                    onChange={setAmount}
                    error={amountError}
                    max={V2_MONEY_INPUT_MAX}
                    wide
                    slider={{
                      min: 10_000,
                      max: V2_MONEY_INPUT_MAX,
                      step: 1_00_000,
                      scale: "log",
                    }}
                  />
                  <V2NumberField
                    label="Period"
                    value={days}
                    onChange={setDays}
                    error={daysError}
                    min={1}
                    max={DAYS_MAX}
                    width="days"
                    suffix="days"
                    hint={`${horizonYears.toFixed(2)} years (365-day basis)`}
                    slider={{ min: 1, max: DAYS_MAX, step: 1 }}
                  />
                </V2FieldRow>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--v2-faint)]">
                  Mutual fund
                </p>
                <V2FieldRow>
                  <V2PercentField
                    label="Expected return"
                    value={mfReturn}
                    onChange={(v) => setMfReturn(Math.max(0, v))}
                    error={mfInterestErr}
                  />
                  <V2PercentField
                    label="Tax rate"
                    value={mfTax}
                    onChange={(v) => setMfTax(Math.max(0, v))}
                    error={mfTaxErr}
                  />
                </V2FieldRow>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--v2-faint)]">
                  Fixed deposit
                </p>
                <V2FieldRow>
                  <V2PercentField
                    label="Interest rate"
                    value={fdReturn}
                    onChange={(v) => setFdReturn(Math.max(0, v))}
                    error={fdInterestErr}
                  />
                  <V2PercentField
                    label="Tax rate"
                    value={fdTax}
                    onChange={(v) => setFdTax(Math.max(0, v))}
                    error={fdTaxErr}
                  />
                </V2FieldRow>
              </div>
            </div>
            </V2FormScope>
          </V2Section>
        }
        results={
          <>
            {error ? <V2Status tone="error">{error}</V2Status> : null}
            {!canCalculate ? (
              <V2Status tone="error">
                <p className="font-semibold">Fix the inputs to refresh the calculation.</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {fieldErrors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </V2Status>
            ) : null}

            {result && insight ? (
              <>
                <V2MetricStrip>
                  <V2Metric label="Investment" value={amount} />
                  <V2Metric label="MF post-tax" value={result.mf.postTax} tone="accent" />
                  <V2Metric label="FD post-tax" value={result.fd.postTax} />
                  <V2Metric
                    label="Post-tax edge"
                    value={insight.advantage}
                    hint={insight.winner}
                    tone="accent"
                  />
                </V2MetricStrip>

                <div className="grid gap-3 lg:grid-cols-2">
                  <V2Section title="Side-by-side compare" subtitle="Invested, gain, tax, and net">
                    <V2ChartFrame heightClass="min-h-[320px] h-[320px]">
                      <CompareChart
                        title=""
                        className="h-full min-h-[320px] !border-0 !bg-transparent !p-0 !shadow-none !rounded-none"
                        data={result.compare}
                        series={[
                          { key: "mf", label: "Mutual Fund", color: chart.gain },
                          { key: "fd", label: "Fixed Deposit", color: chart.invested },
                        ]}
                      />
                    </V2ChartFrame>
                  </V2Section>

                  <div className="grid gap-3">
                    <V2Section title="MF mix" subtitle="Invested, gain, tax">
                      <V2ChartFrame heightClass="min-h-[220px] h-[220px]">
                        <CompositionChart
                          title=""
                          className="h-full min-h-[220px] !border-0 !bg-transparent !p-0 !shadow-none !rounded-none"
                          compact
                          centerValue={result.mf.net}
                          centerLabel="MF net"
                          slices={[
                            { name: "Invested", value: result.mf.invested, color: chart.invested },
                            { name: "Gain", value: result.mf.gain, color: chart.gain },
                            { name: "Tax", value: result.mf.tax, color: chart.tax },
                          ]}
                        />
                      </V2ChartFrame>
                    </V2Section>
                    <V2Section title="FD mix" subtitle="Invested, gain, tax">
                      <V2ChartFrame heightClass="min-h-[220px] h-[220px]">
                        <CompositionChart
                          title=""
                          className="h-full min-h-[220px] !border-0 !bg-transparent !p-0 !shadow-none !rounded-none"
                          compact
                          centerValue={result.fd.net}
                          centerLabel="FD net"
                          slices={[
                            { name: "Invested", value: result.fd.invested, color: chart.invested },
                            { name: "Gain", value: result.fd.gain, color: chart.a },
                            { name: "Tax", value: result.fd.tax, color: chart.tax },
                          ]}
                        />
                      </V2ChartFrame>
                    </V2Section>
                  </div>
                </div>

                <V2Section title="Detailed ledger" subtitle="Post-tax comparison metrics">
                  <V2Table
                    columns={[
                      { key: "label", header: "Metric", align: "left" },
                      { key: "mf", header: "Mutual Fund", align: "right" },
                      { key: "fd", header: "Fixed Deposit", align: "right" },
                      { key: "delta", header: "Difference", align: "right" },
                    ]}
                    rows={[
                      {
                        label: "Annualized return",
                        mf: formatINRCurrency(result.mf.annualizedReturn),
                        fd: formatINRCurrency(result.fd.annualizedReturn),
                        delta: formatINRCurrency(
                          result.mf.annualizedReturn - result.fd.annualizedReturn,
                        ),
                      },
                      {
                        label: "Pre-tax return",
                        mf: formatINRCurrency(result.mf.preTax),
                        fd: formatINRCurrency(result.fd.preTax),
                        delta: formatINRCurrency(result.mf.preTax - result.fd.preTax),
                      },
                      {
                        label: "Tax on profit",
                        mf: formatINRCurrency(result.mf.tax),
                        fd: formatINRCurrency(result.fd.tax),
                        delta: formatINRCurrency(result.mf.tax - result.fd.tax),
                      },
                      {
                        label: "Post-tax return",
                        mf: formatINRCurrency(result.mf.postTax),
                        fd: formatINRCurrency(result.fd.postTax),
                        delta: formatINRCurrency(result.mf.postTax - result.fd.postTax),
                      },
                      {
                        label: "Final maturity",
                        mf: formatINRCurrency(result.mf.net),
                        fd: formatINRCurrency(result.fd.net),
                        delta: formatINRCurrency(result.mf.net - result.fd.net),
                      },
                    ]}
                  />
                </V2Section>

                <V2Disclaimer>
                  Figures are for illustration only. Comparison uses stated MF and FD rates with
                  tax rates over {days} days ({horizonYears.toFixed(2)} years). Premature FD exit
                  and market risk on mutual funds are not modelled. MF tax{" "}
                  {formatPercent(mfTax)}; FD tax {formatPercent(fdTax)}.
                </V2Disclaimer>
              </>
            ) : null}
          </>
        }
      />

      {result ? (
        <V2MfVsFdAdvisoryDossier
          data={{
            clientName: name,
            age,
            email,
            phone,
            amount,
            days,
            mfReturnPct: mfReturn,
            fdReturnPct: fdReturn,
            mfTaxPct: mfTax,
            fdTaxPct: fdTax,
            mf: result.mf,
            fd: result.fd,
            difference: result.difference,
            mfAdvantage: result.mfAdvantage,
            fdAdvantage: result.fdAdvantage,
          }}
        />
      ) : null}
    </>
  );
}
