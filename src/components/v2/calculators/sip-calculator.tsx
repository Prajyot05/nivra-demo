"use client";

import { useMemo, useState } from "react";
import {
  CompositionChart,
  GrowthChart,
  ageError,
  emailError,
  formatINRCurrency,
  formatPercent,
  nameError,
  phoneError,
  rateError,
} from "@nivra/ui";
import { YEARS_MAX } from "@nivra/ui/limits";
import { V2_MONEY_INPUT_MAX } from "@/components/v2/tokens";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import {
  SipCalculatorDossier,
  SIP_CALCULATOR_REPORT_ID,
} from "@/components/reports/sip-calculator-dossier";
import { V2ChartFrame, V2_CHART_CLASS } from "@/components/v2/chart-frame";
import {
  V2MoneyField,
  V2NumberField,
  V2PercentField,
  V2TextField,
  V2FieldRow,
  V2FormScope,
  V2ViewToggle,
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

const SIP_AMOUNT_MIN = 1_000;

type YearRow = {
  year: number;
  monthly: number;
  investedToDate: number;
  yearEnd: number;
  inflationAdjusted?: number;
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
  schedule: YearRow[];
};

export function V2SipCalculator() {
  const { chart } = useV2Theme();
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(45);
  const [email, setEmail] = useState(DUMMY_REPORT_CONTACT.email);
  const [phone, setPhone] = useState(DUMMY_REPORT_CONTACT.phone);
  const [sipMonthly, setSipMonthly] = useState(25_000);
  const [sipYears, setSipYears] = useState(15);
  const [investYears, setInvestYears] = useState(15);
  const [sipReturn, setSipReturn] = useState(12);
  const [sipInflation, setSipInflation] = useState(5.75);
  const [sipDelay, setSipDelay] = useState(0);
  const [sipTax, setSipTax] = useState(12.5);
  const [corpusView, setCorpusView] = useState<"nominal" | "inflation">("nominal");
  const [isDownloading, setIsDownloading] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

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

  const fieldErrors = [
    clientNameError,
    clientAgeError,
    clientEmailError,
    clientPhoneError,
    sipMonthlyError,
    sipYearsError,
    sipHorizonError,
    sipReturnError,
    sipInflationError,
    sipDelayError,
    sipTaxError,
  ].filter((msg): msg is string => Boolean(msg));
  const canCalculate = fieldErrors.length === 0;

  const input = useMemo(
    () => ({
      clientName: name,
      age,
      monthlyInvestment: sipMonthly,
      sipYears,
      investYears,
      returnPct: sipReturn,
      inflationPct: sipInflation,
      delayMonths: Math.max(0, Math.round(sipDelay)),
      taxPct: sipTax,
    }),
    [name, age, sipMonthly, sipYears, investYears, sipReturn, sipInflation, sipDelay, sipTax],
  );

  const { result, error, loading } = useCalculate<GrowthResult>(
    "growth-sip",
    input,
    canCalculate,
    { debounceMs: 60 },
  );

  const resetDefaults = () => {
    setName("Mr. Anshu Kaul");
    setAge(45);
    setEmail(DUMMY_REPORT_CONTACT.email);
    setPhone(DUMMY_REPORT_CONTACT.phone);
    setSipMonthly(25_000);
    setSipYears(15);
    setInvestYears(15);
    setSipReturn(12);
    setSipInflation(5.75);
    setSipDelay(0);
    setSipTax(12.5);
    setFormResetKey((k) => k + 1);
  };

  const handleDownload = async () => {
    if (!result || isDownloading) return;
    setIsDownloading(true);
    try {
      const safeName = (name || "client")
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      await generatePdfFromElement(
        SIP_CALCULATOR_REPORT_ID,
        `sip-calculator-${safeName || "report"}`,
      );
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const hasDelay =
    sipDelay > 0 && result?.costOfDelay != null && result.delayedMaturity != null;

  return (
    <>
      <V2PageHeader
        title="SIP Calculator"
        description="Monthly systematic investment plan with inflation, tax, and delay impact."
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
            subtitle="Client profile and SIP assumptions"
            actions={
              <V2Button onClick={resetDefaults}>Reset</V2Button>
            }
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
                    label="Monthly SIP"
                    value={sipMonthly}
                    onChange={setSipMonthly}
                    error={sipMonthlyError}
                    max={V2_MONEY_INPUT_MAX}
                    wide
                    slider={{
                      min: SIP_AMOUNT_MIN,
                      max: V2_MONEY_INPUT_MAX,
                      step: 1_000,
                      scale: "log",
                    }}
                  />
                  <V2NumberField
                    label="SIP years"
                    value={sipYears}
                    onChange={setSipYears}
                    error={sipYearsError ?? (sipYears > investYears ? sipHorizonError : undefined)}
                    min={1}
                    max={YEARS_MAX}
                    width="years"
                    suffix="yrs"
                    slider={{ min: 1, max: YEARS_MAX, step: 1 }}
                  />
                  <V2NumberField
                    label="Horizon"
                    value={investYears}
                    onChange={setInvestYears}
                    error={sipHorizonError}
                    min={1}
                    max={YEARS_MAX}
                    width="years"
                    suffix="yrs"
                    slider={{ min: 1, max: YEARS_MAX, step: 1 }}
                  />
                  <V2NumberField
                    label="Delay"
                    value={sipDelay}
                    onChange={(v) => setSipDelay(Math.max(0, v))}
                    error={sipDelayError}
                    min={0}
                    max={YEARS_MAX * 12}
                    width="months"
                    suffix="mo"
                    slider={{ min: 0, max: YEARS_MAX * 12, step: 1 }}
                  />
                </V2FieldRow>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--v2-faint)]">
                  Rates
                </p>
                <V2FieldRow>
                  <V2PercentField
                    label="Expected return"
                    value={sipReturn}
                    onChange={(v) => setSipReturn(Math.max(0, v))}
                    error={sipReturnError}
                  />
                  <V2PercentField
                    label="Inflation"
                    value={sipInflation}
                    onChange={(v) => setSipInflation(Math.max(0, v))}
                    error={sipInflationError}
                  />
                  <V2PercentField
                    label="Tax on gains"
                    value={sipTax}
                    onChange={(v) => setSipTax(Math.max(0, v))}
                    error={sipTaxError}
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <V2ViewToggle
                    value={corpusView}
                    onChange={setCorpusView}
                    options={[
                      { id: "nominal", label: "Nominal" },
                      { id: "inflation", label: "Inflation-adj." },
                    ]}
                  />
                </div>

                <V2MetricStrip>
                  <V2Metric label="Total invested" value={result.totalInvested} />
                  <V2Metric
                    label={corpusView === "inflation" ? "Real gain" : "Estimated gain"}
                    value={
                      corpusView === "inflation"
                        ? (result.inflationAdjustedGain ??
                          (result.inflationAdjusted != null
                            ? result.inflationAdjusted - result.totalInvested
                            : result.gain))
                        : result.gain
                    }
                    tone="accent"
                  />
                  <V2Metric
                    label={corpusView === "inflation" ? "Inflation-adj. corpus" : "Maturity value"}
                    value={
                      corpusView === "inflation"
                        ? (result.inflationAdjusted ?? result.maturity)
                        : result.maturity
                    }
                    tone="accent"
                  />
                  <V2Metric
                    label="Net after tax"
                    value={result.netAfterTax}
                    hint={
                      result.inflationAdjusted != null && corpusView === "nominal"
                        ? `Inflation-adj. ${formatINRCurrency(result.inflationAdjusted)}`
                        : `Tax ${formatINRCurrency(result.tax)}`
                    }
                  />
                </V2MetricStrip>

                {hasDelay ? (
                  <V2Status tone="warn">
                    Waiting {sipDelay} month{sipDelay === 1 ? "" : "s"} reduces maturity to{" "}
                    {formatINRCurrency(result.delayedMaturity ?? 0)}. Opportunity cost:{" "}
                    {formatINRCurrency(result.costOfDelay ?? 0)}.
                  </V2Status>
                ) : null}

                <div className="grid gap-3 lg:grid-cols-2">
                  <V2Section
                    title="Corpus growth"
                    subtitle={
                      corpusView === "inflation"
                        ? "Invested vs inflation-adjusted path"
                        : "Invested vs maturity path"
                    }
                  >
                    <V2ChartFrame>
                      <GrowthChart
                        title=""
                        className={V2_CHART_CLASS}
                        strokeWidth={2}
                        data={result.schedule.map((row) => ({
                          year: row.year,
                          invested: row.investedToDate,
                          corpus:
                            corpusView === "inflation"
                              ? (row.inflationAdjusted ?? row.yearEnd)
                              : row.yearEnd,
                          inflationAdjusted: row.inflationAdjusted ?? row.yearEnd,
                        }))}
                        series={
                          corpusView === "inflation"
                            ? [
                                { key: "invested", label: "Invested", color: chart.invested },
                                {
                                  key: "corpus",
                                  label: "Inflation-adjusted",
                                  color: chart.inflation,
                                },
                              ]
                            : [
                                { key: "invested", label: "Invested", color: chart.invested },
                                { key: "corpus", label: "Maturity", color: chart.gain },
                                {
                                  key: "inflationAdjusted",
                                  label: "Inflation-adjusted",
                                  color: chart.inflation,
                                },
                              ]
                        }
                      />
                    </V2ChartFrame>
                  </V2Section>

                  <V2Section title="Corpus mix" subtitle="Invested, gain, and tax">
                    <V2ChartFrame heightClass="min-h-[280px] h-[280px]">
                      <CompositionChart
                        title=""
                        className={V2_CHART_CLASS}
                        centerValue={
                          corpusView === "inflation"
                            ? (result.inflationAdjusted ?? result.maturity)
                            : result.maturity
                        }
                        centerLabel={corpusView === "inflation" ? "Real" : "Pre-tax"}
                        slices={[
                          { name: "Invested", value: result.totalInvested, color: chart.invested },
                          {
                            name: corpusView === "inflation" ? "Real gain" : "Gain",
                            value: Math.max(
                              0,
                              corpusView === "inflation"
                                ? (result.inflationAdjusted ?? result.maturity) -
                                    result.totalInvested
                                : result.gain,
                            ),
                            color: chart.gain,
                          },
                          { name: "Tax", value: result.tax, color: chart.tax },
                        ]}
                      />
                    </V2ChartFrame>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] text-[var(--v2-muted)]">
                      <span>Tax: {formatINRCurrency(result.tax)}</span>
                      <span className="text-right">
                        Net: {formatINRCurrency(result.netAfterTax)}
                      </span>
                    </div>
                  </V2Section>
                </div>

                <V2Section title="Year-wise schedule" subtitle="Contribution and corpus by year">
                  <V2Table
                    columns={[
                      { key: "year", header: "Year", align: "left" },
                      { key: "monthly", header: "Monthly SIP", align: "right" },
                      { key: "invested", header: "Invested", align: "right" },
                      {
                        key: "corpus",
                        header: corpusView === "inflation" ? "Inflation-adj." : "Year-end",
                        align: "right",
                      },
                      ...(corpusView === "nominal"
                        ? [{ key: "real", header: "Inflation-adj.", align: "right" as const }]
                        : []),
                    ]}
                    rows={result.schedule.map((row) => ({
                      year: row.year,
                      monthly: formatINRCurrency(row.monthly),
                      invested: formatINRCurrency(row.investedToDate),
                      corpus: formatINRCurrency(
                        corpusView === "inflation"
                          ? (row.inflationAdjusted ?? row.yearEnd)
                          : row.yearEnd,
                      ),
                      real: formatINRCurrency(row.inflationAdjusted ?? row.yearEnd),
                    }))}
                  />
                </V2Section>

                <V2Disclaimer>
                  Figures are for illustration only. SIP projections compound with the stated
                  return, inflation, and tax assumptions. Markets carry risk; past performance does
                  not guarantee future results. Tax {formatPercent(sipTax)} applied on gains only.
                </V2Disclaimer>
              </>
            ) : null}
          </>
        }
      />

      {result && result.inflationAdjusted != null ? (
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
            schedule: result.schedule,
          }}
        />
      ) : null}
    </>
  );
}
