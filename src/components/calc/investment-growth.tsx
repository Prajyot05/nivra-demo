"use client";

import { useMemo, useState } from "react";
import {
  ClientHeader,
  CompositionChart,
  GrowthChart,
  ModeTabs,
  MoneyInput,
  PercentInput,
  ResultCard,
  RESULTS_LEFT,
  RESULTS_RIGHT,
  RESULTS_SPLIT,
  ScheduleTable,
  SelectInput,
  StatCard,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { useCalculate } from "@/hooks/use-calculate";

const MODES = [
  { id: "sip", label: "SIP" },
  { id: "stepup", label: "Step-up" },
  { id: "lumpsum", label: "Lumpsum" },
  { id: "periodic", label: "Periodic" },
] as const;

const VISIBLE_MODES = MODES.filter((mode) => mode.id === "lumpsum");

type Mode = (typeof MODES)[number]["id"];

const FREQUENCY_OPTIONS = [
  { value: "1", label: "1 · Yearly" },
  { value: "2", label: "2 · Half-yearly" },
  { value: "3", label: "3 · Every 4 months" },
  { value: "4", label: "4 · Quarterly" },
  { value: "6", label: "6 · Every 2 months" },
  { value: "12", label: "12 · Monthly" },
];

const FORM_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(6.75rem,1fr))] items-start gap-x-2 gap-y-2";

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

const CALCULATOR_ID: Record<Mode, string> = {
  sip: "growth-sip",
  stepup: "growth-stepup",
  lumpsum: "growth-lumpsum",
  periodic: "growth-periodic",
};

export function InvestmentGrowth() {
  const [mode, setMode] = useState<Mode>("lumpsum");
  const [name, setName] = useState("Mr. Anshu Kaul");
  const [age, setAge] = useState(30);

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

  const [lumpAmount, setLumpAmount] = useState(5_000_000);
  const [lumpYears, setLumpYears] = useState(16);
  const [lumpReturn, setLumpReturn] = useState(12);
  const [lumpInflation, setLumpInflation] = useState(5.75);
  const [lumpDelay, setLumpDelay] = useState(6);
  const [lumpTax, setLumpTax] = useState(0);

  const [periodicAmount, setPeriodicAmount] = useState(100_000);
  const [timesPerYear, setTimesPerYear] = useState(2);
  const [periodicYears, setPeriodicYears] = useState(1);
  const [periodicReturn, setPeriodicReturn] = useState(12);
  const [periodicTax, setPeriodicTax] = useState(12);

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
      case "lumpsum":
        return {
          clientName: name,
          age,
          amount: lumpAmount,
          years: lumpYears,
          returnPct: lumpReturn,
          inflationPct: lumpInflation,
          delayMonths: Math.max(0, Math.round(lumpDelay)),
          taxPct: lumpTax,
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
    lumpAmount,
    lumpYears,
    lumpReturn,
    lumpInflation,
    lumpDelay,
    lumpTax,
    periodicAmount,
    timesPerYear,
    periodicYears,
    periodicReturn,
    periodicTax,
  ]);

  const { result, error, loading } = useCalculate<GrowthResult>(CALCULATOR_ID[mode], input);

  return (
    <CalculatorPage
      title="Investment Growth"
      description="SIP, step-up, lumpsum, and periodic. Unprotected Excel rates and beginning-of-period SIP."
      modes={<ModeTabs tabs={VISIBLE_MODES} value={mode} onChange={(id) => setMode(id as Mode)} />}
      form={
        mode === "sip" ? (
          <div className={FORM_GRID}>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput label="Monthly SIP" value={sipMonthly} onChange={setSipMonthly} />
            <YearInput
              label="SIP years"
              value={sipYears}
              min={1}
              max={100}
              onChange={(years) => {
                setSipYears(years);
                setInvestYears((horizon) => Math.max(horizon, years));
              }}
            />
            <YearInput
              label="Horizon (yrs)"
              value={investYears}
              min={sipYears}
              max={100}
              onChange={(years) => setInvestYears(Math.max(years, sipYears))}
            />
            <PercentInput label="Return (%)" value={sipReturn} onChange={setSipReturn} />
            <PercentInput label="Inflation (%)" value={sipInflation} onChange={setSipInflation} />
            <YearInput label="Delay (mos)" value={sipDelay} min={0} max={1200} onChange={setSipDelay} />
            <PercentInput label="Tax (%)" value={sipTax} onChange={setSipTax} />
          </div>
        ) : mode === "stepup" ? (
          <div className={FORM_GRID}>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput label="Start SIP" value={stepStart} onChange={setStepStart} />
            <YearInput label="SIP years" value={stepYears} min={1} max={100} onChange={setStepYears} />
            <PercentInput label="Return (%)" value={stepReturn} onChange={setStepReturn} />
            <PercentInput label="Step-up (%)" value={stepUpPct} onChange={setStepUpPct} />
            <PercentInput label="Inflation (%)" value={stepInflation} onChange={setStepInflation} />
            <PercentInput label="Tax (%)" value={stepTax} onChange={setStepTax} />
          </div>
        ) : mode === "lumpsum" ? (
          <div className={FORM_GRID}>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput label="Amount" value={lumpAmount} onChange={setLumpAmount} />
            <YearInput value={lumpYears} min={1} max={100} onChange={setLumpYears} />
            <PercentInput label="Return (%)" value={lumpReturn} onChange={setLumpReturn} />
            <PercentInput label="Inflation (%)" value={lumpInflation} onChange={setLumpInflation} />
            <YearInput label="Delay (mos)" value={lumpDelay} min={0} max={1200} onChange={setLumpDelay} />
            <PercentInput label="Tax (%)" value={lumpTax} onChange={setLumpTax} />
          </div>
        ) : (
          <div className={FORM_GRID}>
            <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
            <MoneyInput label="Amount each" value={periodicAmount} onChange={setPeriodicAmount} />
            <SelectInput
              label="Times / year"
              value={String(timesPerYear)}
              onChange={(value) => setTimesPerYear(Number(value))}
              options={FREQUENCY_OPTIONS}
              hint="Must divide 12"
            />
            <YearInput label="Tenure (yrs)" value={periodicYears} min={1} max={50} onChange={setPeriodicYears} />
            <PercentInput label="Return (%)" value={periodicReturn} onChange={setPeriodicReturn} />
            <PercentInput label="Tax (%)" value={periodicTax} onChange={setPeriodicTax} />
          </div>
        )
      }
      results={
        <div className="flex flex-col gap-4">
          {error ? <p className="text-sm text-[var(--app-danger)]">{error}</p> : null}
          {loading && !result ? (
            <p className="text-sm text-[var(--app-text-muted)]">Calculating…</p>
          ) : null}
          {result ? <GrowthResults mode={mode} result={result} /> : null}
        </div>
      }
    />
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

function GrowthResults({ mode, result }: { mode: Mode; result: GrowthResult }) {
  const items = resultItems(mode, result);
  const yearRows = result.schedule.filter(isYearRow);
  const periodicRows = result.schedule.filter((row): row is PeriodicRow => "contributionFv" in row);
  const donut = (
    <CompositionChart
      title="Invested / gain / tax"
      slices={mixSlices(result)}
      centerLabel="Maturity"
      centerValue={result.maturity}
    />
  );

  const requiredChart =
    mode === "periodic" ? (
      <CompositionChart
        title="Periodic mix"
        slices={mixSlices(result)}
        centerLabel="Maturity"
        centerValue={result.maturity}
      />
    ) : mode === "lumpsum" ? (
      <GrowthChart
        title="Full return vs inflation-adjusted"
        data={yearRows.map((row) => ({
          year: row.year,
          corpus: row.yearEnd,
          inflationAdjusted: row.inflationAdjusted ?? row.yearEnd,
        }))}
        series={[
          { key: "corpus", label: "Full return", color: "var(--app-chart-invested)" },
          { key: "inflationAdjusted", label: "Inflation-adjusted", color: "var(--app-chart-gain)" },
        ]}
      />
    ) : (
      <GrowthChart
        title="Investment vs corpus"
        data={yearRows.map((row) => ({
          year: row.year,
          invested: row.investedToDate,
          corpus: row.yearEnd,
          inflationAdjusted: row.inflationAdjusted ?? row.yearEnd,
        }))}
        series={[
          { key: "invested", label: "Investment", color: "var(--app-chart-invested)" },
          { key: "corpus", label: "Full return", color: "var(--app-chart-gain)" },
          { key: "inflationAdjusted", label: "Inflation-adjusted", color: "var(--app-chart-tax)" },
        ]}
      />
    );

  const extraChart =
    mode === "periodic" ? (
      <GrowthChart
        title="FV of each contribution"
        data={periodicRows.map((row, index) => ({
          year: index + 1,
          fv: row.contributionFv,
          contribution: row.contribution,
        }))}
        series={[
          { key: "fv", label: "FV at horizon", color: "var(--app-chart-gain)" },
          { key: "contribution", label: "Contribution", color: "var(--app-chart-invested)" },
        ]}
      />
    ) : (
      donut
    );

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className={RESULTS_SPLIT}>
        <div className={RESULTS_LEFT}>
          <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            <StatCard title="Invested" value={result.totalInvested} />
            <StatCard title="Maturity" value={result.maturity} variant="soft" />
          </div>
          <div className="flex flex-1 flex-col gap-4">
            {requiredChart}
            {extraChart}
          </div>
        </div>
        <div className={RESULTS_RIGHT}>
          <div className="shrink-0">
            <ResultCard title="Results" items={items} />
          </div>
        </div>
      </div>
      {mode === "periodic" ? (
        <ScheduleTable
          caption="Contribution schedule"
          columns={[
            { key: "month", header: "Month", align: "right" },
            { key: "contribution", header: "Contribution", format: "inr", align: "right" },
            { key: "contributionFv", header: "FV at horizon", format: "inr", align: "right" },
          ]}
          rows={periodicRows}
        />
      ) : (
        <ScheduleTable
          caption="Yearly schedule"
          columns={
            mode === "lumpsum"
              ? [
                  { key: "year", header: "Year" },
                  { key: "investedToDate", header: "Invested", format: "inr", align: "right" },
                  { key: "yearEnd", header: "Year-end", format: "inr", align: "right" },
                  { key: "inflationAdjusted", header: "Inflation-adj.", format: "inr", align: "right" },
                ]
              : [
                  { key: "year", header: "Year" },
                  { key: "monthly", header: "Monthly SIP", format: "inr", align: "right" },
                  { key: "investedToDate", header: "Invested", format: "inr", align: "right" },
                  { key: "yearEnd", header: "Year-end", format: "inr", align: "right" },
                  { key: "inflationAdjusted", header: "Inflation-adj.", format: "inr", align: "right" },
                ]
          }
          rows={yearRows}
        />
      )}
    </div>
  );
}

function resultItems(mode: Mode, result: GrowthResult) {
  const core = [
    {
      label: "Invested",
      value: result.totalInvested,
      hint: result.payments != null ? `${result.payments} payments` : undefined,
    },
    { label: "Maturity", value: result.maturity },
    { label: "Gain", value: result.gain },
  ];

  if (mode === "stepup" && result.startMonthly != null && result.endMonthly != null) {
    core.unshift(
      { label: "Start SIP", value: result.startMonthly },
      { label: "End SIP", value: result.endMonthly },
    );
  }

  if (result.inflationAdjusted != null && mode !== "periodic") {
    core.push({ label: "Inflation-adjusted", value: result.inflationAdjusted });
  }
  if (result.inflationAdjustedGain != null) {
    core.push({ label: "Inflation-adjusted gain", value: result.inflationAdjustedGain });
  }
  if (result.delayedMaturity != null && result.costOfDelay != null) {
    core.push(
      { label: "Delayed maturity", value: result.delayedMaturity },
      { label: "Cost of delay", value: result.costOfDelay },
    );
  }

  core.push({ label: "Tax", value: result.tax }, { label: "Net after tax", value: result.netAfterTax });
  return core;
}
