"use client";

import { useMemo, useState } from "react";
import {
  CalculatorPage,
  ClientHeader,
  ComboChart,
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
  StackedAreaChart,
  StatCard,
  YearInput,
} from "@nivra/ui";
import { useCalculate } from "@/hooks/use-calculate";

const FORM_GRID =
  "grid grid-cols-1 items-start gap-3 min-[400px]:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 sm:gap-4 lg:gap-3 xl:gap-5";

const MODES = [
  { id: "fire", label: "FIRE" },
  { id: "health", label: "Health" },
] as const;

type Mode = (typeof MODES)[number]["id"];

const FACTOR_OPTIONS = [
  { value: "200", label: "200% of current" },
  { value: "150", label: "150% of current" },
  { value: "120", label: "120% of current" },
  { value: "100", label: "Same as current" },
  { value: "80", label: "80% of current" },
  { value: "50", label: "50% of current" },
];

type FireResult = {
  activeYears: number;
  retiredYears: number;
  monthlyExpAtRet: number;
  lifestyleAtRet: number;
  yearlyExpAtRet: number;
  corpusRequired: number;
  currentAtRetirement: number;
  balanceCorpus: number;
  additionalLumpsum: number;
  excess: boolean;
  monthlySip: number;
  stepUpStartSip: number;
  totalSipInvested: number;
  delayLumpsum: number;
  delaySip: number;
  schedule: Array<{
    age: number;
    corpus: number;
    contribution: number;
    withdrawal: number;
    phase: string;
  }>;
};

type HealthResult = {
  activeYears: number;
  retiredYears: number;
  corpusAtRetirement: number;
  monthlyExpAtRetPlus1: number;
  lifestyleAtRetPlus1: number;
  yearsLasting: number;
  monthsLasting: number;
  remainingAtSurvival: number;
  remainingPvToday: number;
  funded: boolean;
  message: string;
  gapAtRetirement: number;
  schedule: Array<{
    age: number;
    corpus: number;
    yearlyExpense: number;
    eventAmount: number;
    phase: string;
  }>;
};

export function FireHealthCalculator() {
  const [mode, setMode] = useState<Mode>("fire");

  const [fireName, setFireName] = useState("Sanjay Gupta");
  const [age, setAge] = useState(40);
  const [retAge, setRetAge] = useState(55);
  const [survAge, setSurvAge] = useState(90);
  const [monthlyExp, setMonthlyExp] = useState(150_000);
  const [lifestyle, setLifestyle] = useState(1_500_000);
  const [mFactor, setMFactor] = useState("100");
  const [lFactor, setLFactor] = useState("100");
  const [infl, setInfl] = useState(5.75);
  const [ret, setRet] = useState(12);
  const [retAfter, setRetAfter] = useState(8);
  const [tax, setTax] = useState(12.5);
  const [c1Amt, setC1Amt] = useState(5_000_000);
  const [c1Ret, setC1Ret] = useState(9);
  const [c2Amt, setC2Amt] = useState(3_500_000);
  const [c2Ret, setC2Ret] = useState(12);
  const [curSip, setCurSip] = useState(10_000);
  const [curSipRet, setCurSipRet] = useState(10);
  const [limitSip, setLimitSip] = useState(0);
  const [stepUp, setStepUp] = useState(10);
  const [delay, setDelay] = useState(3);

  const [hName, setHName] = useState("Opinder Jain");
  const [hAge, setHAge] = useState(59);
  const [hRet, setHRet] = useState(60);
  const [hSurv, setHSurv] = useState(90);
  const [hCorpus, setHCorpus] = useState(250_000_000);
  const [hExp, setHExp] = useState(350_000);
  const [hSav, setHSav] = useState(100_000);
  const [hLife, setHLife] = useState(2_500_000);
  const [hInfl, setHInfl] = useState(5.75);
  const [hReturn, setHReturn] = useState(9.75);
  const [hAfter, setHAfter] = useState(8);
  const [hTax, setHTax] = useState(12.5);
  const [hBenefit, setHBenefit] = useState(0);
  const [eventAge, setEventAge] = useState(62);
  const [eventAmt, setEventAmt] = useState(20_000_000);
  const [eventOn, setEventOn] = useState(true);

  const calculatorId = mode === "fire" ? "fire-planner" : "financial-health";

  const input = useMemo(() => {
    if (mode === "fire") {
      const slices = [
        { returnPct: c1Ret, amount: c1Amt },
        { returnPct: c2Ret, amount: c2Amt },
      ].filter((s) => s.amount > 0);
      return {
        clientName: fireName,
        age,
        retirementAge: retAge,
        survivingAge: survAge,
        monthlyExpenses: monthlyExp,
        lifestyleYearly: lifestyle,
        monthlyExpenseFactorPct: Number(mFactor),
        lifestyleFactorPct: Number(lFactor),
        inflationPct: infl,
        returnPct: ret,
        returnAfterPct: retAfter,
        taxPct: tax,
        corpusSlices: slices,
        currentSipMonthly: curSip,
        currentSipReturnPct: curSipRet,
        limitSipYears: limitSip,
        stepUpPct: stepUp,
        delayMonths: delay,
      };
    }
    return {
      clientName: hName,
      currentCorpus: hCorpus,
      monthlyExpenses: hExp,
      monthlyInvestment: hSav,
      lifestyleYearly: hLife,
      age: hAge,
      retirementAge: hRet,
      survivingAge: hSurv,
      inflationPct: hInfl,
      returnPct: hReturn,
      returnAfterPct: hAfter,
      taxPct: hTax,
      retirementBenefit: hBenefit,
      events: eventOn
        ? [{ age: eventAge, amount: eventAmt, type: "Expense" as const }]
        : [],
    };
  }, [
    mode,
    fireName,
    age,
    retAge,
    survAge,
    monthlyExp,
    lifestyle,
    mFactor,
    lFactor,
    infl,
    ret,
    retAfter,
    tax,
    c1Amt,
    c1Ret,
    c2Amt,
    c2Ret,
    curSip,
    curSipRet,
    limitSip,
    stepUp,
    delay,
    hName,
    hCorpus,
    hExp,
    hSav,
    hLife,
    hAge,
    hRet,
    hSurv,
    hInfl,
    hReturn,
    hAfter,
    hTax,
    hBenefit,
    eventOn,
    eventAge,
    eventAmt,
  ]);

  const { result, error, loading } = useCalculate(calculatorId, input);
  const fire = mode === "fire" ? (result as FireResult | null) : null;
  const health = mode === "health" ? (result as HealthResult | null) : null;

  return (
    <CalculatorPage
      title="FIRE / Financial Health"
      description="FIRE corpus / SIP planner and long-term financial health from Unprotected Excel."
      modes={<ModeTabs tabs={[...MODES]} value={mode} onChange={(id) => setMode(id as Mode)} />}
      form={
        mode === "fire" ? (
          <div className={FORM_GRID}>
            <ClientHeader name={fireName} age={age} onNameChange={setFireName} onAgeChange={setAge} />
            <YearInput label="Retirement age" value={retAge} onChange={setRetAge} />
            <YearInput label="Surviving age" value={survAge} onChange={setSurvAge} />
            <MoneyInput label="Monthly expenses" value={monthlyExp} onChange={setMonthlyExp} />
            <MoneyInput label="Lifestyle (yearly)" value={lifestyle} onChange={setLifestyle} />
            <SelectInput
              label="Monthly exp. at ret."
              value={mFactor}
              onChange={setMFactor}
              options={FACTOR_OPTIONS}
            />
            <SelectInput
              label="Lifestyle at ret."
              value={lFactor}
              onChange={setLFactor}
              options={FACTOR_OPTIONS}
            />
            <PercentInput label="Inflation" value={infl} onChange={setInfl} />
            <PercentInput label="Return (pre)" value={ret} onChange={setRet} />
            <PercentInput label="Return (post)" value={retAfter} onChange={setRetAfter} />
            <PercentInput label="Tax on gains" value={tax} onChange={setTax} />
            <MoneyInput label="Corpus type 1" value={c1Amt} onChange={setC1Amt} />
            <PercentInput label="Type 1 return" value={c1Ret} onChange={setC1Ret} />
            <MoneyInput label="Corpus type 2" value={c2Amt} onChange={setC2Amt} />
            <PercentInput label="Type 2 return" value={c2Ret} onChange={setC2Ret} />
            <MoneyInput label="Current SIP" value={curSip} onChange={setCurSip} />
            <PercentInput label="Current SIP return" value={curSipRet} onChange={setCurSipRet} />
            <YearInput label="Limit SIP years" value={limitSip} onChange={setLimitSip} />
            <PercentInput label="Step-up %" value={stepUp} onChange={setStepUp} />
            <YearInput label="Delay (months)" value={delay} onChange={setDelay} />
          </div>
        ) : (
          <div className={FORM_GRID}>
            <ClientHeader name={hName} age={hAge} onNameChange={setHName} onAgeChange={setHAge} />
            <YearInput label="Retirement age" value={hRet} onChange={setHRet} />
            <YearInput label="Surviving age" value={hSurv} onChange={setHSurv} />
            <MoneyInput label="Current corpus" value={hCorpus} onChange={setHCorpus} />
            <MoneyInput label="Monthly expenses" value={hExp} onChange={setHExp} />
            <MoneyInput label="Monthly investment" value={hSav} onChange={setHSav} />
            <MoneyInput label="Lifestyle (yearly)" value={hLife} onChange={setHLife} />
            <PercentInput label="Inflation" value={hInfl} onChange={setHInfl} />
            <PercentInput label="Return (pre)" value={hReturn} onChange={setHReturn} />
            <PercentInput label="Return (post)" value={hAfter} onChange={setHAfter} />
            <PercentInput label="Tax after ret." value={hTax} onChange={setHTax} />
            <MoneyInput label="Retirement benefit" value={hBenefit} onChange={setHBenefit} />
            <SelectInput
              label="Include sample event"
              value={eventOn ? "yes" : "no"}
              onChange={(v) => setEventOn(v === "yes")}
              options={[
                { value: "yes", label: "Yes · expense at event age" },
                { value: "no", label: "No events" },
              ]}
            />
            <YearInput label="Event age" value={eventAge} onChange={setEventAge} />
            <MoneyInput label="Event amount" value={eventAmt} onChange={setEventAmt} />
          </div>
        )
      }
      results={
        <div className="flex flex-col gap-3">
          {error ? <p className="text-sm text-[var(--app-danger)]">{error}</p> : null}
          {loading && !result ? (
            <p className="text-sm text-[var(--app-text-muted)]">Calculating…</p>
          ) : null}
          {fire ? <FireResults result={fire} retirementAge={retAge} /> : null}
          {health ? <HealthResults result={health} /> : null}
        </div>
      }
    />
  );
}

function FireResults({
  result,
  retirementAge,
}: {
  result: FireResult;
  retirementAge: number;
}) {
  const line = result.schedule.map((row) => ({
    year: row.age,
    corpus: row.corpus,
    retirement: row.age === retirementAge ? row.corpus : 0,
  }));
  const area = result.schedule.map((row) => ({
    year: row.age,
    contribution: row.contribution,
    withdrawal: row.withdrawal,
  }));
  const invested = result.totalSipInvested;
  const gain = Math.max(0, result.balanceCorpus - invested);

  return (
    <div className={RESULTS_SPLIT}>
      <div className={RESULTS_LEFT}>
        <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <StatCard title="Corpus at retirement" value={result.corpusRequired} />
          <StatCard
            title={result.excess ? "Surplus at retirement" : "Monthly SIP needed"}
            value={result.excess ? result.currentAtRetirement - result.corpusRequired : result.monthlySip}
            variant="soft"
          />
        </div>
        <GrowthChart
          title="Corpus vs age"
          data={line}
          series={[
            { key: "corpus", label: "Corpus", color: "var(--app-chart-gain)" },
            { key: "retirement", label: "At retirement", color: "var(--app-chart-tax)" },
          ]}
        />
        <StackedAreaChart
          title="Contributions vs withdrawals"
          data={area}
          series={[
            { key: "contribution", label: "Contributions", color: "var(--app-chart-invested)" },
            { key: "withdrawal", label: "Withdrawals", color: "var(--app-chart-tax)" },
          ]}
        />
        <CompositionChart
          title="Gap funding mix"
          slices={[
            { name: "Invested (SIP)", value: invested, color: "var(--app-chart-invested)" },
            { name: "Gain", value: gain, color: "var(--app-chart-gain)" },
          ]}
          centerLabel="Gap"
          centerValue={result.balanceCorpus}
        />
      </div>
      <div className={RESULTS_RIGHT}>
        <div className="flex shrink-0 flex-col gap-3">
          <ResultCard
            title={result.excess ? "Results · overfunded" : "FIRE summary"}
            items={[
              {
                label: "Yearly exp. at ret.",
                value: result.yearlyExpAtRet,
                hint: `${result.activeYears} active · ${result.retiredYears} retired yrs`,
              },
              { label: "Corpus required", value: result.corpusRequired },
              { label: "Current at retirement", value: result.currentAtRetirement },
              { label: "Additional lumpsum", value: result.additionalLumpsum },
              { label: "Monthly SIP", value: result.monthlySip },
              { label: "Step-up SIP start", value: result.stepUpStartSip },
              ...(result.delaySip > 0
                ? [
                    { label: "Delay lumpsum", value: result.delayLumpsum },
                    { label: "Delay SIP", value: result.delaySip },
                  ]
                : []),
            ]}
          />
          <CompareChart
            title="Delay cost"
            data={[
              { category: "Lumpsum", now: result.additionalLumpsum, delayed: result.delayLumpsum || result.additionalLumpsum },
              { category: "Monthly SIP", now: result.monthlySip, delayed: result.delaySip || result.monthlySip },
            ]}
            series={[
              { key: "now", label: "Start now", color: "var(--app-chart-invested)" },
              { key: "delayed", label: "Delayed", color: "var(--app-chart-tax)" },
            ]}
          />
        </div>
        <ScheduleTable
          caption="Age schedule"
          columns={[
            { key: "age", header: "Age" },
            { key: "phase", header: "Phase", format: "text" },
            { key: "contribution", header: "Contribution", format: "inr", align: "right" },
            { key: "withdrawal", header: "Withdrawal", format: "inr", align: "right" },
            { key: "corpus", header: "Corpus", format: "inr", align: "right" },
          ]}
          rows={result.schedule}
        />
      </div>
    </div>
  );
}

function HealthResults({ result }: { result: HealthResult }) {
  const combo = result.schedule.map((row) => ({
    age: row.age,
    corpus: row.corpus,
    expense: row.yearlyExpense,
  }));

  return (
    <div className={RESULTS_SPLIT}>
      <div className={RESULTS_LEFT}>
        <div className="grid shrink-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2">
          <StatCard title="Corpus at retirement" value={result.corpusAtRetirement} />
          <StatCard
            title={result.funded ? "Remaining at survival" : "Corpus when funds run out"}
            value={result.funded ? result.remainingAtSurvival : 0}
            variant="soft"
            hint={
              result.funded
                ? `Lasts full ${result.retiredYears} yrs`
                : `Lasts ~${result.yearsLasting} of ${result.retiredYears} yrs`
            }
          />
        </div>
        <ComboChart
          title="Corpus and expenses vs age"
          data={combo}
          bars={[{ key: "corpus", label: "Corpus", color: "var(--app-chart-invested)" }]}
          lines={[{ key: "expense", label: "Yearly expense", color: "var(--app-chart-tax)" }]}
        />
        <CompositionChart
          title="Savings vs retirement gap"
          slices={[
            {
              name: "Corpus at retirement",
              value: result.corpusAtRetirement,
              color: "var(--app-chart-invested)",
            },
            {
              name: "Gap",
              value: result.gapAtRetirement,
              color: "var(--app-chart-tax)",
            },
          ]}
          centerLabel={result.funded ? "Funded" : "Short"}
          centerValue={result.corpusAtRetirement}
        />
      </div>
      <div className={RESULTS_RIGHT}>
        <div className="shrink-0">
          <p className="mb-3 text-sm text-[var(--app-text-muted)]">{result.message}</p>
          <ResultCard
            title="Health summary"
            items={[
              { label: "Corpus at retirement", value: result.corpusAtRetirement },
              {
                label: "Remaining at survival",
                value: result.remainingAtSurvival,
                hint: `${result.monthsLasting} months lasting`,
              },
              { label: "PV of remaining today", value: result.remainingPvToday },
              { label: "Monthly exp. @ ret+1", value: result.monthlyExpAtRetPlus1 },
              { label: "Lifestyle @ ret+1", value: result.lifestyleAtRetPlus1 },
              { label: "Retirement gap", value: result.gapAtRetirement },
            ]}
          />
        </div>
        <ScheduleTable
          caption="Age path"
          columns={[
            { key: "age", header: "Age" },
            { key: "phase", header: "Phase", format: "text" },
            { key: "yearlyExpense", header: "Expense", format: "inr", align: "right" },
            { key: "eventAmount", header: "Event", format: "inr", align: "right" },
            { key: "corpus", header: "Corpus", format: "inr", align: "right" },
          ]}
          rows={result.schedule}
        />
      </div>
    </div>
  );
}
