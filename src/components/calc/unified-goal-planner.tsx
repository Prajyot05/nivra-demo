"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ClientHeader,
  CompareChart,
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
  WaterfallChart,
  YearInput,
} from "@nivra/ui";
import { CalculatorPage } from "@/components/layout/calculator-page-with-nav";
import { useCalculate } from "@/hooks/use-calculate";

const MODES = [
  { id: "sip", label: "SIP vs Step-up" },
  { id: "current", label: "Current investment" },
  { id: "ls-sip", label: "LS + SIP options" },
  { id: "existing", label: "Existing SIP" },
  { id: "periodic", label: "Periodic lumpsum" },
  { id: "compounding", label: "Growth steps" },
] as const;

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

const CALCULATOR_ID: Record<Mode, string> = {
  sip: "goal-sip",
  current: "goal-current",
  "ls-sip": "goal-ls-sip",
  existing: "goal-existing-sip",
  periodic: "goal-periodic",
  compounding: "goal-compounding",
};

type GoalLeg = {
  monthlySip: number;
  endMonthlySip?: number;
  invested: number;
  maturity: number;
  gain: number;
  tax: number;
  netAfterTax: number;
  lumpsum?: number;
};

type GoalPlannerResult = {
  inflAdjGoal: number;
  targetGoal: number;
  shortfall?: number;
  overfunded?: boolean;
  extraYears?: number;
  sipAfterExtra?: number;
  lumpsumAfterExtra?: number;
  existing?: {
    corpusFv: number;
    sipFv: number;
    sipInvested?: number;
    totalFv: number;
    totalInvested: number;
    netCredit: number;
  };
  periodic?: {
    maturity: number;
    totalInvested: number;
    payments: number;
    netCredit: number;
  };
  extraLumpsum?: number;
  extraLumpsumFv?: number;
  existingCredit?: number;
  allLumpsum?: number;
  allSip?: number;
  mixSip?: number;
  mixStepUp?: number;
  mixStepUpEnd?: number;
  mixShortfall?: number;
  standard?: GoalLeg;
  stepUp?: GoalLeg;
  lumpsum?: GoalLeg;
  schedule: Array<Record<string, number>>;
  delays?: Array<{ months: number; sipRequired: number; extraInvested: number }>;
};

export function UnifiedGoalPlanner() {
  const [mode, setMode] = useState<Mode>("sip");
  const [name, setName] = useState("Mr. John Doe");
  const [age, setAge] = useState(30);
  const [goalAmount, setGoalAmount] = useState(10_000_000);
  const [tenureYears, setTenureYears] = useState(15);
  const [returnPct, setReturnPct] = useState(12);
  const [inflationPct, setInflationPct] = useState(5.25);
  const [taxPct, setTaxPct] = useState(12.5);
  const [stepUpPct, setStepUpPct] = useState(10);
  const [useInflAdj, setUseInflAdj] = useState(true);
  const [currentCorpus, setCurrentCorpus] = useState(500_000);
  const [currentMonthlySip, setCurrentMonthlySip] = useState(5_000);
  const [extraLumpsum, setExtraLumpsum] = useState(200_000);
  const [periodicAmount, setPeriodicAmount] = useState(100_000);
  const [timesPerYear, setTimesPerYear] = useState(2);
  const [extraYears, setExtraYears] = useState(5);

  const input = useMemo(() => {
    const base = {
      clientName: name,
      age,
      goalAmount,
      tenureYears,
      returnPct,
      inflationPct,
      taxPct,
      useInflationAdjustedGoal: useInflAdj,
    };
    switch (mode) {
      case "sip":
        return { ...base, stepUpPct };
      case "current":
        return { ...base, stepUpPct, currentCorpus, currentMonthlySip };
      case "ls-sip":
        return { ...base, stepUpPct, currentCorpus, extraLumpsum };
      case "existing":
        return { ...base, stepUpPct, currentMonthlySip };
      case "periodic":
        return { ...base, stepUpPct, amount: periodicAmount, timesPerYear };
      case "compounding":
        return { ...base, extraYears };
    }
  }, [
    mode,
    name,
    age,
    goalAmount,
    tenureYears,
    returnPct,
    inflationPct,
    taxPct,
    stepUpPct,
    useInflAdj,
    currentCorpus,
    currentMonthlySip,
    extraLumpsum,
    periodicAmount,
    timesPerYear,
    extraYears,
  ]);

  const { result, error, loading } = useCalculate<GoalPlannerResult>(CALCULATOR_ID[mode], input);

  return (
    <CalculatorPage
      title="Unified Goal Planner"
      description="Six Unprotected goal modes. Additional SIP / lumpsum / step-up are solved so net after tax hits the goal."
      modes={<ModeTabs tabs={[...MODES]} value={mode} onChange={(id) => setMode(id as Mode)} />}
      form={
        <div className={FORM_GRID}>
          <ClientHeader name={name} age={age} onNameChange={setName} onAgeChange={setAge} />
          <MoneyInput label="Goal amount" value={goalAmount} onChange={setGoalAmount} />
          <YearInput label="Tenure (yrs)" value={tenureYears} min={1} max={75} onChange={setTenureYears} />
          <PercentInput label="Return (%)" value={returnPct} onChange={setReturnPct} />
          <PercentInput label="Inflation (%)" value={inflationPct} onChange={setInflationPct} />
          <PercentInput label="Tax (%)" value={taxPct} onChange={setTaxPct} />
          {mode !== "compounding" ? (
            <PercentInput label="Step-up (%)" value={stepUpPct} onChange={setStepUpPct} />
          ) : (
            <YearInput label="Extra years" value={extraYears} min={0} max={50} onChange={setExtraYears} />
          )}
          <SelectInput
            label="Goal basis"
            value={useInflAdj ? "infl" : "raw"}
            onChange={(value) => setUseInflAdj(value === "infl")}
            options={[
              { value: "raw", label: "Stated goal" },
              { value: "infl", label: "Inflation-adjusted" },
            ]}
          />
          {mode === "current" || mode === "ls-sip" ? (
            <MoneyInput label="Current corpus" value={currentCorpus} onChange={setCurrentCorpus} />
          ) : null}
          {mode === "current" || mode === "existing" ? (
            <MoneyInput label="Current SIP" value={currentMonthlySip} onChange={setCurrentMonthlySip} />
          ) : null}
          {mode === "ls-sip" ? (
            <MoneyInput label="Extra lumpsum" value={extraLumpsum} onChange={setExtraLumpsum} />
          ) : null}
          {mode === "periodic" ? (
            <>
              <MoneyInput label="Periodic amt" value={periodicAmount} onChange={setPeriodicAmount} />
              <SelectInput
                label="Times / year"
                value={String(timesPerYear)}
                onChange={(value) => setTimesPerYear(Number(value))}
                options={FREQUENCY_OPTIONS}
                hint="Must divide 12"
              />
            </>
          ) : null}
        </div>
      }
      results={
        <div className="flex flex-col gap-4">
          {error ? <p className="text-sm text-[var(--app-danger)]">{error}</p> : null}
          {loading && !result ? (
            <p className="text-sm text-[var(--app-text-muted)]">Calculating…</p>
          ) : null}
          {result ? <GoalResults mode={mode} result={result} /> : null}
        </div>
      }
    />
  );
}

function GoalResults({ mode, result }: { mode: Mode; result: GoalPlannerResult }) {
  const summaryItems = [
    { label: "Target goal", value: result.targetGoal },
    { label: "Inflation-adjusted goal", value: result.inflAdjGoal },
  ];
  if (result.shortfall != null) {
    summaryItems.push({ label: "Shortfall to fund", value: result.shortfall });
  }
  if (result.existingCredit != null) {
    summaryItems.push({ label: "Credit from current corpus", value: result.existingCredit });
  }
  if (result.existing) {
    summaryItems.push(
      { label: "Existing corpus FV", value: result.existing.corpusFv },
      { label: "Existing SIP FV", value: result.existing.sipFv },
      { label: "Existing net credit", value: result.existing.netCredit },
    );
  }
  if (result.periodic) {
    summaryItems.push(
      { label: "Periodic maturity", value: result.periodic.maturity },
      { label: "Periodic invested", value: result.periodic.totalInvested },
      { label: "Periodic net credit", value: result.periodic.netCredit },
    );
  }
  if (result.allLumpsum != null && result.allSip != null) {
    summaryItems.push(
      { label: "All lumpsum (today)", value: result.allLumpsum },
      { label: "All SIP (monthly)", value: result.allSip },
      { label: "Mix remaining SIP", value: result.mixSip ?? 0 },
    );
  }
  if (result.sipAfterExtra != null && result.lumpsumAfterExtra != null) {
    summaryItems.push(
      { label: `SIP after +${result.extraYears ?? 0}y`, value: result.sipAfterExtra },
      { label: `Lumpsum after +${result.extraYears ?? 0}y`, value: result.lumpsumAfterExtra },
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className={RESULTS_SPLIT}>
        <div className={RESULTS_LEFT}>
          <GoalHero mode={mode} result={result} />
          <div className="flex flex-1 flex-col gap-4">
            {goalRequiredChart(mode, result)}
            {goalExtraChart(mode, result)}
          </div>
        </div>
        <div className={RESULTS_RIGHT}>
          <div className="flex flex-col gap-4">
            <ResultCard
              title={result.overfunded ? "Results · already funded" : "Goal summary"}
              items={summaryItems}
            />
            {result.standard ? (
              <ResultCard
                title={mode === "sip" ? "Standard SIP" : "Additional SIP"}
                items={legItems(result.standard)}
              />
            ) : null}
            {result.stepUp ? (
              <ResultCard
                title={mode === "sip" ? "Step-up SIP" : "Additional step-up SIP"}
                items={legItems(result.stepUp)}
              />
            ) : null}
            {result.lumpsum?.lumpsum != null ? (
              <ResultCard title="Additional lumpsum today" items={legItems(result.lumpsum)} />
            ) : null}
          </div>
        </div>
      </div>
      <ScheduleTable
        caption="Yearly schedule"
        columns={scheduleColumns(mode)}
        rows={result.schedule}
      />
      {result.delays && result.delays.length > 0 ? (
        <ScheduleTable
          className="max-h-[160px] min-h-[120px] flex-none"
          caption="Cost of delay"
          columns={[
            { key: "months", header: "Delay (months)" },
            { key: "sipRequired", header: "SIP required", format: "inr", align: "right" },
            { key: "extraInvested", header: "Extra invested", format: "inr", align: "right" },
          ]}
          rows={result.delays}
        />
      ) : null}
    </div>
  );
}

function GoalHero({ mode, result }: { mode: Mode; result: GoalPlannerResult }) {
  if (mode === "sip" && result.standard && result.stepUp) {
    return (
      <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
        <StatCard title="Standard SIP · monthly" value={result.standard.monthlySip} />
        <StatCard title="Step-up SIP · monthly" value={result.stepUp.monthlySip} variant="soft" />
      </div>
    );
  }
  if (result.standard) {
    return (
      <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
        <StatCard title="Target goal" value={result.targetGoal} />
        <StatCard
          title={result.standard.lumpsum != null ? "Additional lumpsum" : "Additional SIP · monthly"}
          value={result.standard.lumpsum ?? result.standard.monthlySip}
          variant="soft"
        />
      </div>
    );
  }
  return (
    <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
      <StatCard title="Target goal" value={result.targetGoal} />
      <StatCard title="Inflation-adjusted" value={result.inflAdjGoal} variant="soft" />
    </div>
  );
}

function investedTaxCorpus(legs: Array<{ key: string; label: string; color: string; leg: GoalLeg }>) {
  return {
    data: [
      Object.assign(
        { category: "Invested" },
        Object.fromEntries(legs.map((l) => [l.key, l.leg.invested])),
      ),
      Object.assign(
        { category: "Cap. gains tax" },
        Object.fromEntries(legs.map((l) => [l.key, l.leg.tax])),
      ),
      Object.assign(
        { category: "Corpus" },
        Object.fromEntries(legs.map((l) => [l.key, l.leg.maturity])),
      ),
    ] as Array<{ category: string; [k: string]: string | number }>,
    series: legs.map((l) => ({ key: l.key, label: l.label, color: l.color })),
  };
}

function goalRequiredChart(mode: Mode, result: GoalPlannerResult): ReactNode {
  if (mode === "sip" && result.standard && result.stepUp) {
    const { data, series } = investedTaxCorpus([
      { key: "sip", label: "SIP", color: "var(--app-chart-invested)", leg: result.standard },
      { key: "step", label: "Step-up", color: "var(--app-chart-gain)", leg: result.stepUp },
    ]);
    return <CompareChart title="SIP vs step-up" data={data} series={series} />;
  }

  if (mode === "current" && result.lumpsum && result.standard && result.stepUp) {
    const { data, series } = investedTaxCorpus([
      { key: "ls", label: "Extra LS", color: "var(--app-chart-invested)", leg: result.lumpsum },
      { key: "sip", label: "Extra SIP", color: "var(--app-chart-gain)", leg: result.standard },
      { key: "step", label: "Extra step-up", color: "var(--app-chart-tax)", leg: result.stepUp },
    ]);
    return <CompareChart title="Extra LS vs SIP vs step-up" data={data} series={series} />;
  }

  if (mode === "ls-sip" && result.standard) {
    return (
      <CompositionChart
        title="Mix: corpus / lumpsum / SIP"
        centerLabel="Mix"
        slices={[
          {
            name: "Existing credit",
            value: result.existingCredit ?? 0,
            color: "var(--app-chart-invested)",
          },
          {
            name: "Extra lumpsum",
            value: result.extraLumpsum ?? 0,
            color: "var(--app-primary-soft)",
          },
          {
            name: "SIP invested",
            value: result.standard.invested,
            color: "var(--app-chart-gain)",
          },
          {
            name: "SIP gain",
            value: result.standard.gain,
            color: "var(--app-std-text)",
          },
          {
            name: "SIP tax",
            value: result.standard.tax,
            color: "var(--app-chart-tax)",
          },
        ]}
      />
    );
  }

  if (mode === "existing" && result.existing && result.standard) {
    return (
      <CompositionChart
        title="Existing SIP vs additional SIP"
        centerLabel="Corpus"
        centerValue={result.existing.sipFv + result.standard.maturity}
        compact
        slices={[
          {
            name: "SIP1 invested",
            value: result.existing.sipInvested ?? result.existing.totalInvested,
            color: "var(--app-chart-invested)",
          },
          {
            name: "SIP2 invested",
            value: result.standard.invested,
            color: "var(--app-chart-gain)",
          },
          {
            name: "SIP2 gain",
            value: result.standard.gain,
            color: "var(--app-primary-soft)",
          },
          {
            name: "SIP2 tax",
            value: result.standard.tax,
            color: "var(--app-chart-tax)",
          },
        ]}
      />
    );
  }

  if (mode === "periodic" && result.periodic) {
    return (
      <CompositionChart
        title="Periodic mix"
        centerLabel="Maturity"
        centerValue={result.periodic.maturity}
        slices={[
          {
            name: "Periodic invested",
            value: result.periodic.totalInvested,
            color: "var(--app-chart-invested)",
          },
          {
            name: "Periodic net credit",
            value: result.periodic.netCredit,
            color: "var(--app-chart-gain)",
          },
        ]}
      />
    );
  }

  if (mode === "compounding") {
    return (
      <GrowthChart
        title="SIP vs lumpsum growth steps"
        data={result.schedule.map((row) => ({
          year: row.year,
          sip: row.sipYearEnd ?? 0,
          lumpsum: row.lumpsumEnd ?? 0,
        }))}
        series={[
          { key: "sip", label: "SIP year-end", color: "var(--app-chart-invested)" },
          { key: "lumpsum", label: "Lumpsum year-end", color: "var(--app-chart-gain)" },
        ]}
      />
    );
  }

  return null;
}

function goalExtraChart(mode: Mode, result: GoalPlannerResult): ReactNode {
  if (mode === "sip") {
    return null;
  }

  if (mode === "current" && result.existing) {
    return (
      <WaterfallChart
        title="How the goal is funded"
        steps={[
          { label: "Existing credit", value: result.existing.netCredit, kind: "increase" },
          { label: "Additional", value: result.shortfall ?? 0, kind: "increase" },
          { label: "Target", value: result.targetGoal, kind: "total" },
        ]}
      />
    );
  }

  if (mode === "ls-sip" && result.allLumpsum != null && result.allSip != null) {
    return (
      <CompareChart
        title="All-LS vs all-SIP vs mix"
        data={[
          { category: "All lumpsum today", amount: result.allLumpsum },
          { category: "All SIP monthly", amount: result.allSip },
          { category: "Mix SIP monthly", amount: result.mixSip ?? 0 },
        ]}
        series={[{ key: "amount", label: "Required", color: "var(--app-chart-invested)" }]}
      />
    );
  }

  if (mode === "existing" && result.existing && result.standard) {
    return (
      <CompareChart
        title="Existing vs additional SIP"
        data={[
          {
            category: "Invested",
            existing: result.existing.totalInvested,
            additional: result.standard.invested,
          },
          {
            category: "Corpus",
            existing: result.existing.sipFv,
            additional: result.standard.maturity,
          },
        ]}
        series={[
          { key: "existing", label: "Existing", color: "var(--app-chart-invested)" },
          { key: "additional", label: "Additional", color: "var(--app-chart-gain)" },
        ]}
      />
    );
  }

  if (mode === "periodic" && result.standard && result.stepUp) {
    return (
      <CompareChart
        title="Remaining SIP vs step-up"
        data={[
          {
            category: "Monthly",
            sip: result.standard.monthlySip,
            step: result.stepUp.monthlySip,
          },
          {
            category: "Invested",
            sip: result.standard.invested,
            step: result.stepUp.invested,
          },
          {
            category: "Corpus",
            sip: result.standard.maturity,
            step: result.stepUp.maturity,
          },
        ]}
        series={[
          { key: "sip", label: "Remaining SIP", color: "var(--app-chart-invested)" },
          { key: "step", label: "Remaining step-up", color: "var(--app-chart-gain)" },
        ]}
      />
    );
  }

  if (mode === "compounding" && result.standard) {
    return (
      <CompositionChart
        title="SIP at goal year"
        centerLabel="Corpus"
        centerValue={result.standard.maturity}
        slices={[
          { name: "Invested", value: result.standard.invested, color: "var(--app-chart-invested)" },
          { name: "Gain", value: result.standard.gain, color: "var(--app-chart-gain)" },
        ]}
      />
    );
  }

  return null;
}

function legItems(leg: GoalLeg) {
  const items = [];
  if (leg.lumpsum != null) items.push({ label: "Lumpsum", value: leg.lumpsum });
  items.push({ label: "Monthly SIP", value: leg.monthlySip });
  if (leg.endMonthlySip != null) items.push({ label: "End SIP", value: leg.endMonthlySip });
  items.push(
    { label: "Invested", value: leg.invested },
    { label: "Maturity", value: leg.maturity },
    { label: "Gain", value: leg.gain },
    { label: "Tax", value: leg.tax },
    { label: "Net after tax", value: leg.netAfterTax },
  );
  return items;
}

function scheduleColumns(mode: Mode) {
  if (mode === "sip") {
    return [
      { key: "year", header: "Year" },
      { key: "stdMonthly", header: "Std SIP", format: "inr" as const, align: "right" as const },
      { key: "stdYearEnd", header: "Std end", format: "inr" as const, align: "right" as const },
      { key: "stepMonthly", header: "Step SIP", format: "inr" as const, align: "right" as const },
      { key: "stepYearEnd", header: "Step end", format: "inr" as const, align: "right" as const },
    ];
  }
  if (mode === "compounding") {
    return [
      { key: "year", header: "Year" },
      { key: "sipMonthly", header: "Monthly SIP", format: "inr" as const, align: "right" as const },
      { key: "sipYearEnd", header: "SIP year-end", format: "inr" as const, align: "right" as const },
      { key: "lumpsumEnd", header: "Lumpsum year-end", format: "inr" as const, align: "right" as const },
    ];
  }
  if (mode === "ls-sip") {
    return [
      { key: "year", header: "Year" },
      { key: "extraLumpEnd", header: "Extra LS", format: "inr" as const, align: "right" as const },
      { key: "sipMonthly", header: "Mix SIP", format: "inr" as const, align: "right" as const },
      { key: "sipYearEnd", header: "SIP end", format: "inr" as const, align: "right" as const },
      { key: "combinedEnd", header: "Combined", format: "inr" as const, align: "right" as const },
    ];
  }
  if (mode === "periodic") {
    return [
      { key: "year", header: "Year" },
      { key: "sipMonthly", header: "Add. SIP", format: "inr" as const, align: "right" as const },
      { key: "sipYearEnd", header: "SIP end", format: "inr" as const, align: "right" as const },
      { key: "stepMonthly", header: "Step SIP", format: "inr" as const, align: "right" as const },
      { key: "stepYearEnd", header: "Step end", format: "inr" as const, align: "right" as const },
    ];
  }
  return [
    { key: "year", header: "Year" },
    { key: "existingEnd", header: "Existing", format: "inr" as const, align: "right" as const },
    { key: "sipMonthly", header: "Add. SIP", format: "inr" as const, align: "right" as const },
    { key: "sipYearEnd", header: "SIP end", format: "inr" as const, align: "right" as const },
    { key: "combinedSipEnd", header: "Combined", format: "inr" as const, align: "right" as const },
  ];
}
