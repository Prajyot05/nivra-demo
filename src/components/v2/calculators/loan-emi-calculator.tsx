"use client";

import { useMemo, useState } from "react";
import {
  CompositionChart,
  GrowthChart,
  StackedAreaChart,
  ageError,
  emailError,
  formatINRCurrency,
  nameError,
  phoneError,
  rateError,
} from "@nivra/ui";
import { YEARS_MAX } from "@nivra/ui/limits";
import { V2_MONEY_INPUT_MAX } from "@/components/v2/tokens";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import {
  LoanEmiDossier,
  LOAN_EMI_REPORT_ID,
} from "@/components/reports/loan-emi-dossier";
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

type AmortRow = {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
};

type EmiResult = {
  emi: number;
  totalPrincipal: number;
  totalInterest: number;
  totalPaid: number;
  schedule: AmortRow[];
  recoverReturnPct: number;
  delayMonths: number;
  recoverMonths: number;
  delayedRecoverMonths: number;
  recoverMonthlySip: number;
  recoverInvested: number;
  delayedRecoverMonthlySip: number;
  delayedRecoverInvested: number;
};

export function V2LoanEmiCalculator() {
  const { chart } = useV2Theme();
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(45);
  const [email, setEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [phone, setPhone] = useState(DUMMY_REPORT_CONTACT.phone);
  const [principal, setPrincipal] = useState(7_500_000);
  const [years, setYears] = useState(20);
  const [interest, setInterest] = useState(9.2);
  const [recoverReturn, setRecoverReturn] = useState(12);
  const [delayMonths, setDelayMonths] = useState(12);
  const [isDownloading, setIsDownloading] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  const clientNameError = nameError(name);
  const clientAgeError = ageError(age);
  const clientEmailError = emailError(email);
  const clientPhoneError = phoneError(phone);
  const principalError =
    !Number.isFinite(principal) || principal <= 0 ? "Loan amount is required." : undefined;
  const yearsError =
    !Number.isFinite(years) || years < 1 ? "Tenure must be at least 1 year." : undefined;
  const interestError = rateError(interest, "Interest");
  const recoverError = rateError(recoverReturn, "Recover return");
  const delayError =
    !Number.isFinite(delayMonths) || delayMonths < 0
      ? "Delay cannot be negative."
      : delayMonths >= years * 12
        ? "Delay must be less than the loan tenure in months."
        : undefined;

  const fieldErrors = [
    clientNameError,
    clientAgeError,
    clientEmailError,
    clientPhoneError,
    principalError,
    yearsError,
    interestError,
    recoverError,
    delayError,
  ].filter((msg): msg is string => Boolean(msg));
  const canCalculate = fieldErrors.length === 0;

  const input = useMemo(
    () => ({
      clientName: name,
      age,
      principal,
      years,
      interestPct: interest,
      recoverReturnPct: recoverReturn,
      delayMonths,
    }),
    [name, age, principal, years, interest, recoverReturn, delayMonths],
  );

  const { result, error, loading } = useCalculate<EmiResult>("loan-emi", input, canCalculate, {
    debounceMs: 60,
  });

  const resetDefaults = () => {
    setName("Mr. Anshu Kaul");
    setAge(45);
    setEmail(DUMMY_REPORT_CONTACT.email);
    setPhone(DUMMY_REPORT_CONTACT.phone);
    setPrincipal(7_500_000);
    setYears(20);
    setInterest(9.2);
    setRecoverReturn(12);
    setDelayMonths(12);
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
      await generatePdfFromElement(LOAN_EMI_REPORT_ID, `loan-emi-${safe || "report"}`);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const yearlyRows = useMemo(() => {
    if (!result?.schedule?.length) return [];
    const byYear = new Map<
      number,
      { year: number; principal: number; interest: number; balance: number }
    >();
    for (const row of result.schedule) {
      const year = Math.ceil(row.month / 12);
      const prev = byYear.get(year) ?? { year, principal: 0, interest: 0, balance: row.balance };
      prev.principal += row.principal;
      prev.interest += row.interest;
      prev.balance = row.balance;
      byYear.set(year, prev);
    }
    return Array.from(byYear.values());
  }, [result]);

  const chartSample = useMemo(() => {
    if (!result?.schedule?.length) return [];
    const step = Math.max(1, Math.floor(result.schedule.length / 48));
    return result.schedule
      .filter((_, i) => i % step === 0 || i === result.schedule.length - 1)
      .map((row) => ({
        year: row.month,
        principal: row.principal,
        interest: row.interest,
        balance: row.balance,
        interestPaid: 0,
      }));
  }, [result]);

  const stackedSample = useMemo(() => {
    if (!result?.schedule?.length) return [];
    let interestPaid = 0;
    const step = Math.max(1, Math.floor(result.schedule.length / 48));
    return result.schedule
      .map((row) => {
        interestPaid += row.interest;
        return {
          year: row.month,
          remainingPrincipal: row.balance,
          interestPaid,
        };
      })
      .filter((_, i, arr) => i % step === 0 || i === arr.length - 1);
  }, [result]);

  return (
    <>
      <V2PageHeader
        title="Loan EMI Calculator"
        description="Monthly EMI, amortisation schedule, and SIP needed to offset total interest."
        actions={
          <ReportDownloadButton
            onClick={handleDownload}
            disabled={!result}
            loading={isDownloading}
          />
        }
      />

      <V2CalculatorLayout
        resultsLoading={loading && !result && canCalculate}
        form={
          <V2Section
            title="Inputs"
            subtitle="Loan terms and recovery assumptions"
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
                  Loan
                </p>
                <V2FieldRow>
                  <V2MoneyField
                    label="Loan amount"
                    value={principal}
                    onChange={setPrincipal}
                    error={principalError}
                    max={V2_MONEY_INPUT_MAX}
                    wide
                    slider={{
                      min: 10_000,
                      max: V2_MONEY_INPUT_MAX,
                      step: 50_000,
                      scale: "log",
                    }}
                  />
                  <V2NumberField
                    label="Tenure"
                    value={years}
                    onChange={setYears}
                    error={yearsError}
                    min={1}
                    max={YEARS_MAX}
                    width="years"
                    suffix="yrs"
                    slider={{ min: 1, max: YEARS_MAX, step: 1 }}
                  />
                  <V2PercentField
                    label="Interest rate"
                    value={interest}
                    onChange={(v) => setInterest(Math.max(0, v))}
                    error={interestError}
                  />
                </V2FieldRow>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--v2-faint)]">
                  Interest recovery SIP
                </p>
                <V2FieldRow>
                  <V2PercentField
                    label="SIP return"
                    value={recoverReturn}
                    onChange={(v) => setRecoverReturn(Math.max(0, v))}
                    error={recoverError}
                  />
                  <V2NumberField
                    label="SIP delay"
                    value={delayMonths}
                    onChange={(v) => setDelayMonths(Math.max(0, v))}
                    error={delayError}
                    min={0}
                    max={Math.max(0, years * 12 - 1)}
                    width="months"
                    suffix="mo"
                    slider={{ min: 0, max: Math.max(1, years * 12 - 1), step: 1 }}
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
            {result ? (
              <>
                <V2MetricStrip>
                  <V2Metric label="Monthly EMI" value={result.emi} tone="accent" />
                  <V2Metric label="Principal" value={result.totalPrincipal} />
                  <V2Metric label="Total interest" value={result.totalInterest} tone="danger" />
                  <V2Metric label="Total paid" value={result.totalPaid} />
                </V2MetricStrip>

                <V2MetricStrip className="lg:grid-cols-3">
                  <V2Metric
                    label="Recovery SIP (start now)"
                    value={result.recoverMonthlySip}
                    hint={`${result.recoverMonths} months · invested ${formatINRCurrency(result.recoverInvested)}`}
                    tone="accent"
                  />
                  <V2Metric
                    label="Recovery SIP (delayed)"
                    value={result.delayedRecoverMonthlySip}
                    hint={`${result.delayedRecoverMonths} months · invested ${formatINRCurrency(result.delayedRecoverInvested)}`}
                  />
                  <V2Metric
                    label="Interest share"
                    value={`${((result.totalInterest / result.totalPaid) * 100).toFixed(1)}%`}
                    hint="Of total amount paid"
                    tone="muted"
                  />
                </V2MetricStrip>

                <div className="grid gap-3 lg:grid-cols-2">
                  <V2Section title="EMI split over time" subtitle="Principal vs interest by month">
                    <V2ChartFrame>
                      <GrowthChart
                        title=""
                        className={V2_CHART_CLASS}
                        strokeWidth={2}
                        xTickFormatter={(v) => `M${v}`}
                        data={chartSample}
                        series={[
                          { key: "principal", label: "Principal", color: chart.a },
                          { key: "interest", label: "Interest", color: chart.tax },
                        ]}
                      />
                    </V2ChartFrame>
                  </V2Section>

                  <V2Section title="Principal vs interest" subtitle="Lifetime composition">
                    <V2ChartFrame>
                      <CompositionChart
                        title=""
                        className={V2_CHART_CLASS}
                        centerValue={result.totalPaid}
                        centerLabel="Total paid"
                        slices={[
                          {
                            name: "Principal",
                            value: result.totalPrincipal,
                            color: chart.a,
                          },
                          {
                            name: "Interest",
                            value: result.totalInterest,
                            color: chart.tax,
                          },
                        ]}
                      />
                    </V2ChartFrame>
                  </V2Section>
                </div>

                <V2Section
                  title="Outstanding balance"
                  subtitle="Remaining principal versus interest paid to date"
                >
                  <V2ChartFrame heightClass="min-h-[260px] h-[260px]">
                    <StackedAreaChart
                      title=""
                      className="h-full min-h-[260px] !border-0 !bg-transparent !p-0 !shadow-none !rounded-none"
                      data={stackedSample}
                      series={[
                        {
                          key: "remainingPrincipal",
                          label: "Remaining principal",
                          color: chart.a,
                        },
                        {
                          key: "interestPaid",
                          label: "Interest paid",
                          color: chart.tax,
                        },
                      ]}
                    />
                  </V2ChartFrame>
                </V2Section>

                <V2Section title="Year-wise summary" subtitle="Aggregated from the monthly schedule">
                  <V2Table
                    columns={[
                      { key: "year", header: "Year", align: "left" },
                      { key: "principal", header: "Principal paid", align: "right" },
                      { key: "interest", header: "Interest paid", align: "right" },
                      { key: "balance", header: "Closing balance", align: "right" },
                    ]}
                    rows={yearlyRows.map((row) => ({
                      year: row.year,
                      principal: formatINRCurrency(row.principal),
                      interest: formatINRCurrency(row.interest),
                      balance: formatINRCurrency(row.balance),
                    }))}
                  />
                </V2Section>

                <V2Disclaimer>
                  Figures are for illustration only. EMI uses a nominal monthly rate (annual ÷ 12).
                  Interest recovery SIP assumes the stated return over the loan tenure. Actual
                  lender terms may differ.
                </V2Disclaimer>
              </>
            ) : null}
          </>
        }
      />

      {result && Array.isArray(result.schedule) ? (
        <LoanEmiDossier
          data={{
            clientName: name,
            age,
            email,
            phone,
            principal,
            years,
            interestPct: interest,
            recoverReturnPct: result.recoverReturnPct ?? recoverReturn,
            delayMonths: result.delayMonths ?? delayMonths,
            emi: result.emi,
            totalPrincipal: result.totalPrincipal,
            totalInterest: result.totalInterest,
            totalPaid: result.totalPaid,
            recoverMonths: result.recoverMonths,
            delayedRecoverMonths: result.delayedRecoverMonths,
            recoverMonthlySip: result.recoverMonthlySip,
            recoverInvested: result.recoverInvested,
            delayedRecoverMonthlySip: result.delayedRecoverMonthlySip,
            delayedRecoverInvested: result.delayedRecoverInvested,
            schedule: result.schedule,
          }}
        />
      ) : null}
    </>
  );
}
