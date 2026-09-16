"use client";

import { useMemo, useState } from "react";
import { generatePdfFromElement } from "@/lib/pdf-generator";
import {
  ClientHeader,
  CompositionChart,
  FormGrid,
  GrowthChart,
  MoneyInput,
  PercentInput,
  ResultCard,
  ResultsSplit,
  ScheduleTable,
  SelectInput,
  SegmentedChartControl,
  Stack,
  StatCard,
  StatGrid,
  StatusNote,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { GrowthLumpsum } from "@/components/calc/growth-lumpsum";
import { ReportDownloadButton } from "@/components/calc/report-download-button";
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

  const [sipMonthly, setSipMonthly] = useState(1_500);
  const [sipYears, setSipYears] = useState(5);
  const [investYears, setInvestYears] = useState(5);
  const [sipReturn, setSipReturn] = useState(12);
  const [sipInflation, setSipInflation] = useState(5.75);
  const [sipDelay, setSipDelay] = useState(6);
  const [sipTax, setSipTax] = useState(0);

  const sipMonthlyError =
    sipMonthly <= 0 ? "Monthly SIP is required." : undefined;
  const sipYearsError = sipYears < 1 ? "SIP years must be at least 1." : undefined;
  const sipHorizonError =
    investYears < 1
      ? "Horizon must be at least 1 year."
      : sipYears > investYears
        ? "SIP duration cannot be greater than investment horizon."
        : undefined;
  const sipReturnError =
    sipReturn < 0
      ? "Return cannot be negative."
      : sipReturn > 100
        ? "Return cannot exceed 100%."
        : undefined;
  const sipInflationError =
    sipInflation < 0
      ? "Inflation cannot be negative."
      : sipInflation > 100
        ? "Inflation cannot exceed 100%."
        : undefined;
  const sipDelayError =
    sipDelay > investYears * 12
      ? "Delay cannot exceed the investment horizon."
      : undefined;
  const sipTaxError =
    sipTax < 0 ? "Tax cannot be negative." : sipTax > 100 ? "Tax cannot exceed 100%." : undefined;

  const [stepStart, setStepStart] = useState(5_000);
  const [stepYears, setStepYears] = useState(10);
  const [stepReturn, setStepReturn] = useState(12);
  const [stepUpPct, setStepUpPct] = useState(10);
  const [stepInflation, setStepInflation] = useState(5.75);
  const [stepTax, setStepTax] = useState(0);

  const stepStartError = stepStart <= 0 ? "Start SIP is required." : undefined;
  const stepYearsError = stepYears < 1 ? "SIP years must be at least 1." : undefined;
  const stepReturnError =
    stepReturn < 0
      ? "Return cannot be negative."
      : stepReturn > 100
        ? "Return cannot exceed 100%."
        : undefined;
  const stepUpPctError =
    stepUpPct < 0
      ? "Step-up cannot be negative."
      : stepUpPct > 100
        ? "Step-up cannot exceed 100%."
        : undefined;
  const stepInflationError =
    stepInflation < 0
      ? "Inflation cannot be negative."
      : stepInflation > 100
        ? "Inflation cannot exceed 100%."
        : undefined;
  const stepTaxError =
    stepTax < 0 ? "Tax cannot be negative." : stepTax > 100 ? "Tax cannot exceed 100%." : undefined;

  const [periodicAmount, setPeriodicAmount] = useState(100_000);
  const [timesPerYear, setTimesPerYear] = useState(2);
  const [periodicYears, setPeriodicYears] = useState(1);
  const [periodicReturn, setPeriodicReturn] = useState(12);
  const [periodicTax, setPeriodicTax] = useState(12);

  const periodicAmountError =
    periodicAmount <= 0 ? "Amount each is required." : undefined;
  const periodicYearsError = periodicYears < 1 ? "Tenure must be at least 1 year." : undefined;
  const periodicReturnError =
    periodicReturn < 0
      ? "Return cannot be negative."
      : periodicReturn > 100
        ? "Return cannot exceed 100%."
        : undefined;
  const periodicTaxError =
    periodicTax < 0
      ? "Tax cannot be negative."
      : periodicTax > 100
        ? "Tax cannot exceed 100%."
        : undefined;
  const periodicFreqError = !VALID_TIMES_PER_YEAR.has(timesPerYear)
    ? "Select a contribution frequency."
    : undefined;

  const canCalculate =
    mode === "periodic"
      ? !periodicAmountError &&
        !periodicYearsError &&
        !periodicReturnError &&
        !periodicTaxError &&
        !periodicFreqError
      : mode === "sip"
        ? !sipMonthlyError &&
          !sipYearsError &&
          !sipHorizonError &&
          !sipReturnError &&
          !sipInflationError &&
          !sipDelayError &&
          !sipTaxError
        : mode === "stepup"
          ? !stepStartError &&
            !stepYearsError &&
            !stepReturnError &&
            !stepUpPctError &&
            !stepInflationError &&
            !stepTaxError
          : true;

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

  const handleDownload = async () => {
    if (!result || isDownloading) return;

    const safeName = (name || "client")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    const reportByMode: Partial<Record<Exclude<Mode, "lumpsum">, { id: string; filename: string }>> = {
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

  return (
    <>
    <CalculatorPage
      title={getCalculatorPageTitle("/growth", mode)}
      description="Lumpsum and monthly SIP. See how savings grow over time."
      actions={
        <ReportDownloadButton
          onClick={handleDownload}
          disabled={!result}
          loading={isDownloading}
        />
      }
      form={
        mode === "sip" ? (
          <FormGrid>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput
              label="Monthly SIP"
              value={sipMonthly}
              onChange={setSipMonthly}
              error={sipMonthlyError}
            />
            <YearInput
              label="SIP years"
              value={sipYears}
              min={1}
              max={100}
              onChange={setSipYears}
              error={sipYearsError ?? (sipYears > investYears ? sipHorizonError : undefined)}
            />
            <YearInput
              label="Horizon (yrs)"
              value={investYears}
              min={1}
              max={100}
              onChange={setInvestYears}
              error={sipHorizonError}
            />
            <PercentInput
              label="Return"
              value={sipReturn}
              onChange={(v) => setSipReturn(Math.min(100, Math.max(0, v)))}
              error={sipReturnError}
            />
            <PercentInput
              label="Inflation"
              value={sipInflation}
              onChange={(v) => setSipInflation(Math.min(100, Math.max(0, v)))}
              error={sipInflationError}
            />
            <YearInput
              label="Delay (mos)"
              value={sipDelay}
              min={0}
              max={1200}
              onChange={(v) => setSipDelay(Math.max(0, v))}
              error={sipDelayError}
            />
            <PercentInput
              label="Tax"
              value={sipTax}
              onChange={(v) => setSipTax(Math.min(100, Math.max(0, v)))}
              error={sipTaxError}
            />
          </FormGrid>
        ) : mode === "stepup" ? (
          <FormGrid>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput
              label="Start SIP"
              value={stepStart}
              onChange={setStepStart}
              error={stepStartError}
            />
            <YearInput
              label="SIP years"
              value={stepYears}
              min={1}
              max={100}
              onChange={setStepYears}
              error={stepYearsError}
            />
            <PercentInput
              label="Return"
              value={stepReturn}
              onChange={(v) => setStepReturn(Math.min(100, Math.max(0, v)))}
              error={stepReturnError}
            />
            <PercentInput
              label="Step-up"
              value={stepUpPct}
              onChange={(v) => setStepUpPct(Math.min(100, Math.max(0, v)))}
              error={stepUpPctError}
            />
            <PercentInput
              label="Inflation"
              value={stepInflation}
              onChange={(v) => setStepInflation(Math.min(100, Math.max(0, v)))}
              error={stepInflationError}
            />
            <PercentInput
              label="Tax"
              value={stepTax}
              onChange={(v) => setStepTax(Math.min(100, Math.max(0, v)))}
              error={stepTaxError}
            />
          </FormGrid>
        ) : (
          <FormGrid>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput
              label="Amount each"
              value={periodicAmount}
              onChange={setPeriodicAmount}
              error={periodicAmountError}
            />
            <SelectInput
              label="Freq / yr"
              value={String(timesPerYear)}
              onChange={(value) => setTimesPerYear(Number(value))}
              options={FREQUENCY_OPTIONS}
              hint={frequencyHint(timesPerYear)}
              className="min-w-0 text-[13px]"
            />
            <YearInput
              label="Tenure (yrs)"
              value={periodicYears}
              min={1}
              max={50}
              onChange={setPeriodicYears}
              error={periodicYearsError}
            />
            <PercentInput
              label="Return"
              value={periodicReturn}
              onChange={(v) => setPeriodicReturn(Math.min(100, Math.max(0, v)))}
              error={periodicReturnError}
            />
            <PercentInput
              label="Tax"
              value={periodicTax}
              onChange={(v) => setPeriodicTax(Math.min(100, Math.max(0, v)))}
              error={periodicTaxError}
            />
          </FormGrid>
        )
      }
      results={
        <>
          {error ? <StatusNote tone="error">{error}</StatusNote> : null}
          {!canCalculate ? (
            <StatusNote tone="error">
              Fix the inputs above to refresh the calculation. Showing the last valid result.
            </StatusNote>
          ) : null}
          {loading && !result && canCalculate ? (
            <StatusNote tone="pending">Calculating…</StatusNote>
          ) : null}
          {result ? (
            <GrowthResults mode={mode} result={result} timesPerYear={timesPerYear} />
          ) : null}
        </>
      }
    />
    {mode === "sip" && result && result.inflationAdjusted != null ? (
      <SipCalculatorDossier
        data={{
          clientName: name,
          age,
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
}: {
  mode: Exclude<Mode, "lumpsum">;
  result: GrowthResult;
  timesPerYear: number;
}) {
  const items = resultItems(mode, result, timesPerYear);
  const yearRows = result.schedule.filter(isYearRow);
  const periodicRows = result.schedule.filter((row): row is PeriodicRow => "contributionFv" in row);
  const donut = (
    <CompositionChart
      title={mode === "periodic" ? "Periodic mix" : "Invested / gain / tax"}
      showPercentages
      size="lg"
      slices={mixSlices(result)}
      centerLabel="Maturity"
      centerValue={result.maturity}
    />
  );

  const lineChart =
    mode === "periodic" ? null : (
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
          { key: "inflationAdjusted", label: "Inflation-adjusted", color: "var(--app-chart-inflation)" },
        ]}
      />
    );

  const contributionChart =
    mode === "periodic" ? (
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
          { key: "contribution", label: "Contribution", color: "var(--app-chart-invested)" },
        ]}
      />
    ) : null;

  const statGrid = (
    <StatGrid>
      <StatCard title="Invested" value={result.totalInvested} tone="neutral" />
      <StatCard title="Maturity" value={result.maturity} tone="positive" />
      <StatCard title="Net after tax" value={result.netAfterTax} tone="positive" />
    </StatGrid>
  );

  const yearlyColumns = [
    { key: "year", header: "Year", sticky: true },
    {
      key: "monthly",
      header: "Monthly SIP",
      format: "inr" as const,
      align: "right" as const,
      tone: "std" as const,
    },
    {
      key: "investedToDate",
      header: "Invested",
      format: "inr" as const,
      align: "right" as const,
      tone: "std" as const,
    },
    {
      key: "yearEnd",
      header: "Year-end",
      format: "inr" as const,
      align: "right" as const,
      tone: "step" as const,
    },
    {
      key: "inflationAdjusted",
      header: "Inflation-adj.",
      format: "inr" as const,
      align: "right" as const,
      tone: "std" as const,
    },
  ];

  // One reading order for all modes: headline numbers, then the answer
  // panel, then the supporting chart, then the full schedule.
  const primaryChart = mode === "periodic" ? contributionChart : lineChart;

  return (
    <Stack>
      {statGrid}
      <ResultsSplit
        left={
          <SegmentedChartControl
            tabs={[
              {
                id: "growth",
                label: "Growth",
                icon: <LineChart className="w-4 h-4" />,
                content: <div className="flex min-h-[300px] flex-1 flex-col">{primaryChart}</div>
              },
              {
                id: "allocation",
                label: "Allocation",
                icon: <PieChart className="w-4 h-4" />,
                content: <div className="flex min-h-[300px] flex-1 flex-col">{donut}</div>
              }
            ]}
          />
        }
        right={<ResultCard title="Results" items={items} />}
      />
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
          columns={yearlyColumns}
          rows={yearRows}
        />
      )}
    </Stack>
  );
}

function resultItems(mode: Exclude<Mode, "lumpsum">, result: GrowthResult, timesPerYear: number) {
  const core: Array<{
    label: string;
    value?: number;
    displayValue?: string;
    hint?: string;
    tone?: "maturity" | "gain" | "inflation" | "delay" | "tax" | "net";
    highlight?: boolean;
  }> = [];

  if (mode === "periodic") {
    core.push(
      { label: "Invested", value: result.totalInvested },
      {
        label: "Total Contributions",
        displayValue: `${result.payments ?? 0} Payments`,
        value: result.payments ?? 0,
      },
      {
        label: "Contribution Frequency",
        displayValue: frequencyLabel(timesPerYear),
        value: timesPerYear,
      },
      { label: "Maturity", value: result.maturity, tone: "maturity", highlight: true },
      { label: "Gain", value: result.gain, tone: "gain" },
      { label: "Tax", value: result.tax, tone: "tax" },
      { label: "Net after tax", value: result.netAfterTax, tone: "net" },
    );
    return core;
  }

  core.push({
    label: "Invested",
    value: result.totalInvested,
    hint: result.payments != null ? `${result.payments} payments` : undefined,
  });
  core.push({ label: "Maturity", value: result.maturity, tone: "maturity", highlight: true });
  core.push({ label: "Gain", value: result.gain, tone: "gain" });

  if (mode === "stepup" && result.startMonthly != null && result.endMonthly != null) {
    core.unshift(
      { label: "Start SIP", value: result.startMonthly },
      { label: "End SIP", value: result.endMonthly },
    );
  }

  if (result.inflationAdjusted != null) {
    core.push({ label: "Inflation-adjusted", value: result.inflationAdjusted, tone: "inflation" });
  }
  if (result.inflationAdjustedGain != null) {
    core.push({
      label: "Inflation-adjusted gain",
      value: result.inflationAdjustedGain,
      tone: "inflation",
    });
  }
  if (result.delayedMaturity != null && result.costOfDelay != null) {
    core.push(
      { label: "Delayed maturity", value: result.delayedMaturity },
      { label: "Cost of delay", value: result.costOfDelay, tone: "delay" },
    );
  }

  core.push(
    { label: "Tax", value: result.tax, tone: "tax" },
    { label: "Net after tax", value: result.netAfterTax, tone: "net" },
  );
  return core;
}
