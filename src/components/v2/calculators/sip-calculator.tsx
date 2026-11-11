"use client";

import { useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
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
import { ReportStyleDownloadButton } from "@/components/calc/report-style-download-button";
import { DUMMY_REPORT_CONTACT } from "@/components/reports/executive-dossier";
import {
  SIP_DOSSIER_STYLES,
  SipStyledDossier,
  V2_SIP_STYLED_REPORT_ID,
  type SipDossierStyleId,
} from "@/components/v2/reports/sip-styles";
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

type InputTone = "sky" | "green" | "slate" | "sand";

const INPUT_TONES: Record<
  InputTone,
  {
    label: string;
    swatch: string;
    sectionClass: string;
    labelClass: string;
    resetBtnClass: string;
  }
> = {
  sky: {
    label: "Sky Blue",
    swatch: "bg-[#38bdf8]",
    sectionClass: "!bg-[#f0f7ff] !border-[#bae6fd] shadow-[0_1px_3px_0_rgba(14,165,233,0.08)] ring-1 ring-sky-500/[0.08]",
    labelClass: "text-sky-900/75",
    resetBtnClass: "!bg-white !border-sky-200 text-sky-900 shadow-xs hover:!bg-sky-50/50",
  },
  green: {
    label: "Pastel Green",
    swatch: "bg-[#34d399]",
    sectionClass: "!bg-[#f0fdf4] !border-[#bbf7d0] shadow-[0_1px_3px_0_rgba(16,185,129,0.08)] ring-1 ring-emerald-500/[0.08]",
    labelClass: "text-emerald-950/75",
    resetBtnClass: "!bg-white !border-emerald-200 text-emerald-950 shadow-xs hover:!bg-emerald-50/50",
  },
  slate: {
    label: "Soft Slate",
    swatch: "bg-[#94a3b8]",
    sectionClass: "!bg-[#eef2f6] !border-[#cbd5e1] shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.04]",
    labelClass: "text-slate-600",
    resetBtnClass: "!bg-white !border-slate-300 text-slate-700 shadow-xs hover:!bg-slate-50",
  },
  sand: {
    label: "Warm Sand",
    swatch: "bg-[#f59e0b]",
    sectionClass: "!bg-[#fbf8f3] !border-[#f0e6d6] shadow-[0_1px_3px_0_rgba(180,83,9,0.05)] ring-1 ring-amber-700/[0.04]",
    labelClass: "text-amber-950/75",
    resetBtnClass: "!bg-white !border-[#e6d7c3] text-amber-950 shadow-xs hover:!bg-amber-50/50",
  },
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
  const [reportStyle, setReportStyle] = useState<SipDossierStyleId>("classic-memo");
  const [formResetKey, setFormResetKey] = useState(0);
  const [inputTone, setInputTone] = useState<InputTone>("sky");

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

  const handleDownload = async (styleId: SipDossierStyleId) => {
    if (!result || isDownloading) return;
    setIsDownloading(true);
    try {
      flushSync(() => {
        setReportStyle(styleId);
      });
      // Allow the selected theme HTML to mount and fonts to settle.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      await new Promise((resolve) => setTimeout(resolve, 320));
      const safeName = (name || "client")
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      await generatePdfFromElement(
        V2_SIP_STYLED_REPORT_ID,
        `sip-calculator-${styleId}-${safeName || "report"}`,
      );
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const hasDelay =
    sipDelay > 0 && result?.costOfDelay != null && result.delayedMaturity != null;

  const currentTone = INPUT_TONES[inputTone];

  return (
    <>
      <V2PageHeader
        title="SIP Calculator"
        description="Monthly systematic investment plan with inflation, tax, and delay impact."
        actions={
          <ReportStyleDownloadButton
            styles={SIP_DOSSIER_STYLES}
            onDownload={handleDownload}
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
            className={cn("transition-colors duration-200", currentTone.sectionClass)}
            actions={
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1 rounded-md border border-black/10 bg-white/70 p-1 shadow-2xs backdrop-blur-xs"
                  title="Preview input section color"
                >
                  {(Object.keys(INPUT_TONES) as InputTone[]).map((key) => {
                    const t = INPUT_TONES[key];
                    const active = inputTone === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setInputTone(key)}
                        title={t.label}
                        aria-label={t.label}
                        className={cn(
                          "size-4 rounded-full transition-all hover:scale-110",
                          t.swatch,
                          active
                            ? "ring-2 ring-slate-800 ring-offset-1 ring-offset-white scale-110"
                            : "opacity-60 hover:opacity-100",
                        )}
                      />
                    );
                  })}
                </div>
                <V2Button onClick={resetDefaults} className={currentTone.resetBtnClass}>
                  Reset
                </V2Button>
              </div>
            }
          >
            <V2FormScope resetKey={formResetKey}>
            <div className="space-y-2.5">
              <div>
                <p className={cn("mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors", currentTone.labelClass)}>
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
                <p className={cn("mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors", currentTone.labelClass)}>
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
                <p className={cn("mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors", currentTone.labelClass)}>
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
        <SipStyledDossier
          styleId={reportStyle}
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
